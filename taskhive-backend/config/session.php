<?php
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $_SERVER['SERVER_PORT'] == 443;

session_set_cookie_params([
    'lifetime' => 86400,
    'path' => '/',
    'domain' => '', // Use specific domain in prod if needed
    'secure' => $isHttps, // TRUE only if HTTPS
    'httponly' => true,
    'samesite' => $isHttps ? 'None' : 'Lax' // Lax is fine for local dev
]);

session_start();
