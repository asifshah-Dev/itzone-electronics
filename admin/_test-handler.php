<?php
declare(strict_types=1);
require_once __DIR__ . '/../includes/auth.php';
auth_start();
if (!auth_check()) { echo 'Not logged in'; exit; }

$csrf = csrf_token();
echo "<form method='post' action='product-handler.php' enctype='multipart/form-data'>";
echo "<input type='hidden' name='_csrf' value='{$csrf}'>";
echo "<input type='hidden' name='action' value='create'>";
echo "<input name='brand' value='Dell'><br>";
echo "<input name='model' value='Test 001'><br>";
echo "<input name='category' value='laptop'><br>";
echo "<input name='condition_grade' value='A'><br>";
echo "<input name='price' value='1000'><br>";
echo "<input type='file' name='images[0]'><br>";
echo "<button>Submit</button>";
echo "</form>";