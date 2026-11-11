<?php
/**
 * Central configuration. Edit this file only when moving between environments.
 * XAMPP (local) → current values. Hostinger (live) → change these values.
 */

return [
    'db' => [
        'host'     => '127.0.0.1',
        'port'     => 3306,
        'name'     => 'itzone_electronics',
        'user'     => 'root',
        'password' => '',
        'charset'  => 'utf8mb4',
    ],

    // Toggle for local vs live debugging.
    // Keep false in production.
    'debug' => true,
];