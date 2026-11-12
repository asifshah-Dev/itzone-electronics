<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';
auth_start();

if (auth_check()) {
    header('Location: index.php');
    exit;
}

$error = null;
$username = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_check($_POST['_csrf'] ?? null)) {
        $error = 'Security check failed. Please refresh and try again.';
    } else {
        $username = (string) ($_POST['username'] ?? '');
        $password = (string) ($_POST['password'] ?? '');

        [$ok, $msg] = auth_login($username, $password);

        if ($ok) {
            $next = (string) ($_GET['next'] ?? '');
            if ($next !== '' && $next[0] === '/' && strpos($next, '//') !== 0) {
                header('Location: ' . $next);
            } else {
                header('Location: index.php');
            }
            exit;
        }
        $error = $msg;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b1210">
<meta name="robots" content="noindex,nofollow">
<title>Sign in — IT Zone Electronics</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap">
<link rel="stylesheet" href="../assets/css/main.css">

<style>
:root {
  --green: #8dc63f;
  --green-dark: #6faa2e;
  --red: #ed1c24;
  --ink: #0b1210;
  --ink-2: #334155;
  --muted: #64748b;
  --line: #e2e8f0;
  --head: 'Space Grotesk', 'Inter', system-ui, sans-serif;
}

*, *::before, *::after { box-sizing: border-box; }

html, body {
  margin: 0;
  min-height: 100%;
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

.login-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 1.25rem;
  color: var(--ink);
  background:
    radial-gradient(circle at 12% 10%, rgba(141,198,63,0.22), transparent 42%),
    radial-gradient(circle at 90% 92%, rgba(237,28,36,0.12), transparent 42%),
    #eef2ea;
}

/* ═══ Shell ═══ */
.login-shell {
  width: 100%;
  max-width: 1000px;
  display: grid;
  grid-template-columns: 1fr;
  border-radius: 24px;
  overflow: hidden;
  background: #fff;
  box-shadow:
    0 40px 90px -30px rgba(11,18,16,0.45),
    0 14px 34px -14px rgba(11,18,16,0.25);
  animation: shellIn 520ms cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes shellIn {
  from { opacity: 0; transform: translateY(14px) scale(0.985); }
  to   { opacity: 1; transform: none; }
}
@media (min-width: 860px) {
  .login-shell { grid-template-columns: 1.1fr 0.9fr; min-height: 600px; }
}

/* ═══ Brand panel: live circuit board ═══ */
.brand {
  position: relative;
  min-height: 230px;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 50%, rgba(141,198,63,0.16), transparent 55%),
    var(--ink);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
@media (min-width: 860px) { .brand { min-height: 0; order: 0; } }

.circuit {
  position: absolute;
  top: 50%; left: 0;
  width: 100%; height: auto;
  transform: translateY(-50%);
}
@media (min-width: 860px) {
  .circuit { top: 0; height: 100%; transform: none; }
}

.trace {
  fill: none;
  stroke: rgba(255,255,255,0.10);
  stroke-width: 2;
  stroke-linejoin: round;
}
.pulse {
  fill: none;
  stroke: var(--green);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 70 930;
  stroke-dashoffset: 70;
  filter: drop-shadow(0 0 5px rgba(141,198,63,0.9));
  animation: flow 5s linear infinite;
}
.pulse.red {
  stroke: var(--red);
  filter: drop-shadow(0 0 5px rgba(237,28,36,0.9));
}
@keyframes flow {
  from { stroke-dashoffset: 70; }
  to   { stroke-dashoffset: -1000; }
}
.pad { fill: var(--ink); stroke: rgba(141,198,63,0.7); stroke-width: 2; }

/* Logo "chip" at the centre of the board */
.chip {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  padding: 0.9rem 1.4rem;
  background: #fff;
  border-radius: 16px;
  box-shadow:
    0 0 0 1px rgba(141,198,63,0.6),
    0 0 0 8px rgba(141,198,63,0.10),
    0 0 60px rgba(141,198,63,0.35);
  animation: chipGlow 3.2s ease-in-out infinite;
}
.chip img {
  display: block;
  height: 44px;
  width: auto;
  max-width: 180px;
  object-fit: contain;
}
@keyframes chipGlow {
  0%, 100% { box-shadow: 0 0 0 1px rgba(141,198,63,0.6), 0 0 0 8px rgba(141,198,63,0.10), 0 0 50px rgba(141,198,63,0.25); }
  50%      { box-shadow: 0 0 0 1px rgba(141,198,63,0.9), 0 0 0 12px rgba(141,198,63,0.14), 0 0 80px rgba(141,198,63,0.5); }
}
@media (min-width: 860px) {
  .chip { padding: 1.1rem 1.8rem; }
  .chip img { height: 60px; max-width: 220px; }
}

.brand-copy {
  position: relative;
  z-index: 2;
  display: none;
  padding: 5rem 2.25rem 2.25rem;
  background: linear-gradient(to top, var(--ink) 55%, transparent);
}
@media (min-width: 860px) { .brand-copy { display: block; } }
.brand-copy h2 {
  font-family: var(--head);
  font-size: 1.75rem;
  line-height: 1.15;
  letter-spacing: -0.02em;
  font-weight: 700;
  margin: 0 0 0.6rem;
  max-width: 16ch;
}
.brand-copy p {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.55;
  color: rgba(255,255,255,0.68);
  max-width: 34ch;
}

/* ═══ Form side ═══ */
.side-form {
  padding: 2.25rem 1.6rem 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
@media (min-width: 860px) { .side-form { padding: 3rem 2.75rem; } }

.side-form h1 {
  font-family: var(--head);
  font-size: 1.85rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  margin: 0 0 0.4rem;
}
.side-form .sub {
  font-size: 0.9rem;
  color: var(--muted);
  margin: 0 0 1.75rem;
}

.field { margin-bottom: 1rem; }
.field label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--ink-2);
  margin-bottom: 0.4rem;
}
.input-wrap { position: relative; }
.input-wrap .field-ico {
  position: absolute;
  top: 50%; left: 0.95rem;
  width: 19px; height: 19px;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
  transition: color 120ms ease;
}
.input-wrap:focus-within .field-ico { color: var(--green-dark); }

.input-wrap input {
  display: block;
  width: 100%;
  background: #f1f5f9;
  border: 1.5px solid transparent;
  border-radius: 12px;
  padding: 0.95rem 1rem 0.95rem 2.8rem;
  font-size: 16px;
  line-height: 1.3;
  color: var(--ink);
  transition: background 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
  -webkit-appearance: none;
          appearance: none;
}
.input-wrap input::placeholder { color: #94a3b8; }
.input-wrap input:hover { background: #e9eef5; }
.input-wrap input:focus {
  background: #fff;
  border-color: var(--green);
  box-shadow: 0 0 0 4px rgba(141,198,63,0.2);
  outline: none;
}
.input-wrap input[type="password"],
.input-wrap input.is-revealed { padding-right: 3.25rem; }

.pw-toggle {
  position: absolute;
  top: 50%; right: 0.45rem;
  transform: translateY(-50%);
  width: 2.5rem; height: 2.5rem;
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent; border: 0; border-radius: 8px;
  color: var(--muted); cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}
.pw-toggle:hover { background: #e2e8f0; color: var(--ink); }
.pw-toggle:focus-visible { outline: 2px solid var(--green); outline-offset: 2px; }
.pw-toggle svg { width: 20px; height: 20px; }

.caps-hint {
  display: none;
  margin: 0.45rem 0 0;
  font-size: 0.78rem;
  color: #92400e;
}
.caps-hint.is-on { display: block; }

.error {
  display: flex; align-items: flex-start; gap: 0.5rem;
  background: #fdeceb;
  border: 1px solid #ff2b34;
  color: #6b0a10;
  padding: 0.75rem 0.9rem;
  border-radius: 10px;
  font-size: 0.85rem;
  margin-bottom: 1.1rem;
  animation: shake 350ms ease;
}
.error svg { flex: 0 0 auto; margin-top: 1px; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

/* Dark text on green: white on #8dc63f fails contrast */
.submit {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  width: 100%;
  margin-top: 0.6rem;
  padding: 1rem;
  background: var(--green);
  color: var(--ink);
  border: 0;
  border-radius: 12px;
  font-family: var(--head);
  font-size: 1.02rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  box-shadow: 0 8px 22px -8px rgba(141,198,63,0.8);
  transition: background 120ms ease, transform 80ms ease, box-shadow 120ms ease;
}
.submit:hover { background: #9bd44c; box-shadow: 0 12px 28px -8px rgba(141,198,63,0.9); }
.submit:active { transform: translateY(1px); }
.submit:focus-visible { outline: 3px solid rgba(141,198,63,0.4); outline-offset: 3px; }
.submit[disabled] { opacity: 0.75; cursor: progress; }
.submit .spin {
  display: none;
  width: 16px; height: 16px;
  border: 2px solid rgba(11,18,16,0.25);
  border-top-color: var(--ink);
  border-radius: 50%;
  animation: spin 700ms linear infinite;
}
.submit.is-loading .spin { display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

.form-foot {
  text-align: center;
  margin: 1.4rem 0 0;
  font-size: 0.75rem;
  color: #94a3b8;
}

@media (prefers-reduced-motion: reduce) {
  .pulse { animation: none; stroke-dasharray: none; opacity: 0.35; }
  .chip, .login-shell, .error { animation: none; }
}
</style>
</head>
<body>

<div class="login-page">
  <main class="login-shell">

    <!-- Brand panel: circuit board with the logo as the chip -->
    <aside class="brand" aria-hidden="true">
      <svg class="circuit" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <path id="t1" pathLength="1000" d="M0 200 H110 L170 260 V350 H190"/>
          <path id="t2" pathLength="1000" d="M0 400 H190"/>
          <path id="t3" pathLength="1000" d="M0 600 H110 L170 540 V450 H190"/>
          <path id="t4" pathLength="1000" d="M600 180 H490 L430 240 V350 H410"/>
          <path id="t5" pathLength="1000" d="M600 400 H410"/>
          <path id="t6" pathLength="1000" d="M600 620 H490 L430 560 V450 H410"/>
          <path id="t7" pathLength="1000" d="M300 0 V330"/>
          <path id="t8" pathLength="1000" d="M250 0 V90 L220 120 V330"/>
          <path id="t9" pathLength="1000" d="M350 0 V60 L380 90 V330"/>
          <path id="t10" pathLength="1000" d="M300 800 V470"/>
          <path id="t11" pathLength="1000" d="M250 800 V720 L220 690 V470"/>
          <path id="t12" pathLength="1000" d="M350 800 V740 L380 710 V470"/>
        </defs>

        <g>
          <use href="#t1" class="trace"/><use href="#t2" class="trace"/><use href="#t3" class="trace"/>
          <use href="#t4" class="trace"/><use href="#t5" class="trace"/><use href="#t6" class="trace"/>
          <use href="#t7" class="trace"/><use href="#t8" class="trace"/><use href="#t9" class="trace"/>
          <use href="#t10" class="trace"/><use href="#t11" class="trace"/><use href="#t12" class="trace"/>
        </g>
        <g>
          <use href="#t1"  class="pulse"     style="animation-duration:5.2s;animation-delay:-0.4s"/>
          <use href="#t2"  class="pulse"     style="animation-duration:4.2s;animation-delay:-2.1s"/>
          <use href="#t3"  class="pulse red" style="animation-duration:5.8s;animation-delay:-3.3s"/>
          <use href="#t4"  class="pulse"     style="animation-duration:4.8s;animation-delay:-1.2s"/>
          <use href="#t5"  class="pulse"     style="animation-duration:3.9s;animation-delay:-2.8s"/>
          <use href="#t6"  class="pulse"     style="animation-duration:5.5s;animation-delay:-0.9s"/>
          <use href="#t7"  class="pulse"     style="animation-duration:4.4s;animation-delay:-3.6s"/>
          <use href="#t8"  class="pulse red" style="animation-duration:6s;animation-delay:-1.7s"/>
          <use href="#t9"  class="pulse"     style="animation-duration:5s;animation-delay:-2.4s"/>
          <use href="#t10" class="pulse"     style="animation-duration:4.6s;animation-delay:-0.2s"/>
          <use href="#t11" class="pulse"     style="animation-duration:5.4s;animation-delay:-3.1s"/>
          <use href="#t12" class="pulse"     style="animation-duration:4.1s;animation-delay:-1.4s"/>
        </g>
        <g>
          <circle class="pad" cx="190" cy="350" r="4"/><circle class="pad" cx="190" cy="400" r="4"/><circle class="pad" cx="190" cy="450" r="4"/>
          <circle class="pad" cx="410" cy="350" r="4"/><circle class="pad" cx="410" cy="400" r="4"/><circle class="pad" cx="410" cy="450" r="4"/>
          <circle class="pad" cx="220" cy="330" r="4"/><circle class="pad" cx="300" cy="330" r="4"/><circle class="pad" cx="380" cy="330" r="4"/>
          <circle class="pad" cx="220" cy="470" r="4"/><circle class="pad" cx="300" cy="470" r="4"/><circle class="pad" cx="380" cy="470" r="4"/>
        </g>
      </svg>

      <div class="chip">
        <img src="../assets/img/logo.png" alt="IT Zone Electronics">
      </div>

      <div class="brand-copy">
        <h2>Run the shop from one place.</h2>
        <p>Add products, track stock levels and fulfil orders from the admin panel.</p>
      </div>
    </aside>

    <!-- Form side -->
    <section class="side-form">
      <h1>Welcome back</h1>
      <p class="sub">Sign in to manage products, stock and orders.</p>

      <?php if ($error): ?>
        <div class="error" role="alert">
          <i data-lucide="alert-circle" width="18" height="18" aria-hidden="true"></i>
          <span><?= e($error) ?></span>
        </div>
      <?php endif; ?>

      <form method="post" class="login-form" id="loginForm" novalidate>
        <?= csrf_field() ?>

        <div class="field">
          <label for="username">Username</label>
          <div class="input-wrap">
            <i data-lucide="user" class="field-ico" aria-hidden="true"></i>
            <input
              type="text"
              id="username"
              name="username"
              value="<?= e($username) ?>"
              placeholder="Enter your username"
              autocomplete="username"
              autocapitalize="none"
              autocorrect="off"
              spellcheck="false"
              inputmode="text"
              enterkeyhint="next"
              required
              autofocus
              maxlength="60">
          </div>
        </div>

        <div class="field">
          <label for="password">Password</label>
          <div class="input-wrap">
            <i data-lucide="lock" class="field-ico" aria-hidden="true"></i>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              autocomplete="current-password"
              enterkeyhint="go"
              required>
            <button type="button" class="pw-toggle" data-pw-toggle
                    aria-label="Show password" aria-pressed="false">
              <i data-lucide="eye" width="20" height="20"></i>
            </button>
          </div>
          <p class="caps-hint" id="capsHint" role="status">Caps Lock is on.</p>
        </div>

        <button type="submit" class="submit" id="submitBtn">
          <span class="spin" aria-hidden="true"></span>
          <span id="submitLabel">Sign in</span>
        </button>
      </form>

      <p class="form-foot">IT Zone Electronics admin</p>
    </section>

  </main>
</div>

<script src="../assets/js/vendors/lucide.min.js"></script>
<script>
(function () {
  'use strict';

  function renderLucide() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }
  renderLucide();

  var pw = document.getElementById('password');
  var toggle = document.querySelector('[data-pw-toggle]');

  if (toggle && pw) {
    toggle.addEventListener('click', function () {
      var show = pw.type === 'password';
      pw.type = show ? 'text' : 'password';
      pw.classList.toggle('is-revealed', show);
      toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      toggle.setAttribute('aria-pressed', String(show));
      toggle.innerHTML = '<i data-lucide="' + (show ? 'eye-off' : 'eye') + '" width="20" height="20"></i>';
      renderLucide();
      pw.focus();
    });
  }

  // Caps Lock warning
  var caps = document.getElementById('capsHint');
  if (pw && caps) {
    var check = function (e) {
      if (e.getModifierState) caps.classList.toggle('is-on', e.getModifierState('CapsLock'));
    };
    pw.addEventListener('keydown', check);
    pw.addEventListener('keyup', check);
    pw.addEventListener('blur', function () { caps.classList.remove('is-on'); });
  }

  // Loading state on submit (blocks double submits)
  var form = document.getElementById('loginForm');
  var btn = document.getElementById('submitBtn');
  var label = document.getElementById('submitLabel');
  if (form && btn) {
    form.addEventListener('submit', function () {
      btn.classList.add('is-loading');
      btn.setAttribute('aria-busy', 'true');
      label.textContent = 'Signing in…';
      setTimeout(function () { btn.disabled = true; }, 0);
    });
  }
})();
</script>
</body>
</html>