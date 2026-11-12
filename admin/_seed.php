<?php
declare(strict_types=1);

/**
 * ONE-TIME admin seeder. DELETE THIS FILE AFTER USE.
 *
 * Access:  http://localhost/itzone-electronics/admin/_seed.php?token=CHANGE_ME
 * Change the token below to something random before opening the URL.
 */

const SEED_TOKEN = 'change-this-to-a-random-string-right-now';

require_once __DIR__ . '/../config/db.php';

// Gate 1: token in URL
if (!hash_equals(SEED_TOKEN, (string) ($_GET['token'] ?? ''))) {
    http_response_code(403);
    echo 'Forbidden.';
    exit;
}

$pdo = db();
$existing = (int) $pdo->query('SELECT COUNT(*) FROM admins')->fetchColumn();

if ($existing > 0) {
    http_response_code(409);
    echo '<pre>An admin already exists. This seeder is now a no-op.
Delete this file (admin/_seed.php) immediately.</pre>';
    exit;
}

$errors = [];
$success = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');
    $confirm  = (string) ($_POST['confirm']  ?? '');
    $name     = trim((string) ($_POST['name'] ?? 'Administrator'));

    if (!preg_match('/^[a-zA-Z0-9_.-]{3,60}$/', $username)) {
        $errors[] = 'Username must be 3–60 chars: letters, digits, _ . - only.';
    }
    if (strlen($password) < 10) {
        $errors[] = 'Password must be at least 10 characters.';
    }
    if ($password !== $confirm) {
        $errors[] = 'Passwords do not match.';
    }
    if (strlen($name) < 1 || strlen($name) > 120) {
        $errors[] = 'Display name must be 1–120 characters.';
    }

    if (!$errors) {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare(
            'INSERT INTO admins (username, password_hash, name) VALUES (?, ?, ?)'
        );
        $stmt->execute([$username, $hash, $name]);
        $success = true;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Seed Admin (one-time)</title>
<meta name="robots" content="noindex,nofollow">
<style>
  body{font-family:system-ui,sans-serif;background:#0e1116;color:#e6e6e6;min-height:100vh;display:grid;place-items:center;padding:1rem}
  .card{max-width:440px;width:100%;background:#161b22;border:1px solid #2a3140;border-radius:12px;padding:2rem}
  label{display:block;font-size:.85rem;color:#b8c2cf;margin:.75rem 0 .25rem}
  input{width:100%;padding:.5rem;border-radius:6px;border:1px solid #2a3140;background:#0e1116;color:#e6e6e6}
  button{margin-top:1rem;background:#4f8cff;border:0;color:#fff;padding:.55rem 1rem;border-radius:6px;cursor:pointer}
  .err{background:#2a1215;border:1px solid #5a1c22;color:#f3a8ae;padding:.5rem .75rem;border-radius:6px;font-size:.85rem;margin-bottom:.5rem}
  .ok{background:#0f2a1a;border:1px solid #1c5a34;color:#a8f3c4;padding:.75rem;border-radius:6px;font-size:.9rem}
  code{background:#0e1116;padding:.1rem .35rem;border-radius:4px;color:#9ac1ff}
</style>
</head>
<body>
<form class="card" method="post">
  <h1 style="font-size:1.1rem;margin:0 0 .25rem">Create admin account (one-time)</h1>
  <p style="color:#8b96a5;font-size:.85rem;margin:0 0 1rem">After success, delete <code>admin/_seed.php</code>.</p>

  <?php if ($success): ?>
    <div class="ok">
      ✅ Admin account created. You can now log in at
      <a href="login.php" style="color:#9ac1ff">/admin/login.php</a>.<br><br>
      <strong>Delete <code>admin/_seed.php</code> now.</strong>
    </div>
  <?php else: ?>
    <?php foreach ($errors as $err): ?>
      <div class="err"><?= htmlspecialchars($err) ?></div>
    <?php endforeach; ?>

    <label for="username">Username</label>
    <input id="username" name="username" required pattern="[a-zA-Z0-9_.-]{3,60}"
           value="<?= htmlspecialchars($_POST['username'] ?? '') ?>">

    <label for="name">Display name</label>
    <input id="name" name="name" required maxlength="120"
           value="<?= htmlspecialchars($_POST['name'] ?? 'Administrator') ?>">

    <label for="password">Password (min 10 chars)</label>
    <input id="password" name="password" type="password" required minlength="10">

    <label for="confirm">Confirm password</label>
    <input id="confirm" name="confirm" type="password" required minlength="10">

    <button type="submit">Create admin</button>
  <?php endif; ?>
</form>
</body>
</html>