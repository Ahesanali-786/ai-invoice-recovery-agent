<?php
/**
 * Production Router for PHP Built-in Server
 * This handles URL rewriting for Laravel on Railway
 */

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// Serve files directly if they exist
if ($uri !== '/' && file_exists(__DIR__ . '/public' . $uri)) {
    return false;
}

// Otherwise route to index.php (Laravel handles the rest)
require_once __DIR__ . '/public/index.php';
