<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo 'Use POST to logout.';
    exit;
}

if (!csrf_check($_POST['_csrf'] ?? null)) {
    http_response_code(400);
    echo 'Invalid request.';
    exit;
}

auth_logout();
header('Location: login.php');
exit;