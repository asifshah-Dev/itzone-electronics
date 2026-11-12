<?php
/**
 * Authentication helpers.
 * Session-based login, bcrypt password verification,
 * server-side brute-force lockout, CSRF token generation.
 */

declare(strict_types=1);

// ── Session bootstrap (safe to call multiple times) ────────────────────
function auth_start(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    // Secure session cookie flags. Harden before session_start().
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
           || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    session_set_cookie_params([
        'lifetime' => 0,          // session cookie — browser close = gone
        'path'     => '/',
        'domain'   => '',
        'secure'   => $secure,    // HTTPS-only when available
        'httponly' => true,       // JS cannot read it
        'samesite' => 'Lax',      // mitigates CSRF on cross-site nav
    ]);

    session_name('itzone_sid');   // non-default name — less fingerprinting
    session_start();

    // Absolute timeout enforced here: if last activity > 8h ago, kill it.
    $max_idle = 8 * 3600;
    $last = $_SESSION['_last_activity'] ?? null;
    if ($last !== null && (time() - (int) $last) > $max_idle) {
        auth_logout();
        return;
    }
    $_SESSION['_last_activity'] = time();
}

// ── Login ──────────────────────────────────────────────────────────────
/**
 * Attempt login. Returns [bool success, string message].
 * Timing-safe on username lookup, generic error on any failure.
 */
function auth_login(string $username, string $password): array
{
    require_once __DIR__ . '/../config/db.php';
    $pdo = db();

    $username = trim($username);

    // Basic input sanity — reject empty, reject absurdly long
    if ($username === '' || $password === '' || strlen($username) > 60) {
        // Dummy verify to equalize timing regardless of outcome
        password_verify($password, '$2y$10$invalidinvalidinvalidinvalidinvalidinvali');
        return [false, 'Invalid username or password.'];
    }

    // Fetch by username. Prepared → no SQL injection.
    $stmt = $pdo->prepare(
        'SELECT id, username, password_hash, name, failed_attempts, locked_until
           FROM admins
          WHERE username = ?
          LIMIT 1'
    );
    $stmt->execute([$username]);
    $row = $stmt->fetch();

    // If not found, run a dummy verify to keep timing similar
    if (!$row) {
        password_verify($password, '$2y$10$invalidinvalidinvalidinvalidinvalidinvali');
        return [false, 'Invalid username or password.'];
    }

    // Locked?
    if (!empty($row['locked_until']) && strtotime($row['locked_until']) > time()) {
        $mins = (int) ceil((strtotime($row['locked_until']) - time()) / 60);
        return [false, "Account temporarily locked. Try again in {$mins} min."];
    }

    // Verify password
    if (!password_verify($password, $row['password_hash'])) {
        // Increment failure count, lock after 5
        $attempts = (int) $row['failed_attempts'] + 1;
        $lockUntil = null;
        if ($attempts >= 5) {
            $lockUntil = date('Y-m-d H:i:s', time() + 15 * 60);
            $attempts  = 0;   // reset counter after locking
        }
        $upd = $pdo->prepare(
            'UPDATE admins SET failed_attempts = ?, locked_until = ? WHERE id = ?'
        );
        $upd->execute([$attempts, $lockUntil, $row['id']]);

        return [false, 'Invalid username or password.'];
    }

    // ✅ Success
    // Reset counters
    $pdo->prepare(
        'UPDATE admins SET failed_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = ?'
    )->execute([$row['id']]);

    // Session fixation defense
    session_regenerate_id(true);
    $_SESSION['admin_id']       = (int) $row['id'];
    $_SESSION['admin_username'] = $row['username'];
    $_SESSION['admin_name']     = $row['name'];
    $_SESSION['_last_activity'] = time();
    $_SESSION['_login_at']      = time();

    return [true, 'Logged in.'];
}

// ── Logout ─────────────────────────────────────────────────────────────
function auth_logout(): void
{
    auth_start();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            [
                'expires'  => time() - 42000,
                'path'     => $p['path'],
                'domain'   => $p['domain'],
                'secure'   => $p['secure'],
                'httponly' => $p['httponly'],
                'samesite' => $p['samesite'] ?? 'Lax',
            ]
        );
    }
    session_destroy();
}

// ── Accessors ──────────────────────────────────────────────────────────
function auth_check(): bool
{
    auth_start();
    return !empty($_SESSION['admin_id']);
}

function auth_user(): ?array
{
    auth_start();
    if (empty($_SESSION['admin_id'])) {
        return null;
    }
    return [
        'id'       => (int) $_SESSION['admin_id'],
        'username' => $_SESSION['admin_username'] ?? '',
        'name'     => $_SESSION['admin_name'] ?? '',
    ];
}

/**
 * Require a logged-in admin. Redirects to login if not authenticated.
 */
function auth_require(): void
{
    if (!auth_check()) {
        $here = $_SERVER['REQUEST_URI'] ?? '/admin/';
        header('Location: login.php?next=' . urlencode($here));
        exit;
    }
}

// ── CSRF ───────────────────────────────────────────────────────────────
function csrf_token(): string
{
    auth_start();
    if (empty($_SESSION['_csrf'])) {
        $_SESSION['_csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['_csrf'];
}

function csrf_check(?string $token): bool
{
    auth_start();
    if (empty($_SESSION['_csrf']) || empty($token)) {
        return false;
    }
    return hash_equals($_SESSION['_csrf'], $token);
}

function csrf_field(): string
{
    return '<input type="hidden" name="_csrf" value="' . htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8') . '">';
}

// ── HTML escape shortcut ───────────────────────────────────────────────
function e(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}