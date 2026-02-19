<?php

/**
 * Production Router for PHP Built-in Server
 * Handles URL rewriting for Laravel on Railway
 */
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// API routes - let Laravel handle these
if (strpos($uri, '/api/') === 0) {
    require_once __DIR__ . '/public/index.php';
    return;
}

// Serve files directly if they exist
if ($uri !== '/' && file_exists(__DIR__ . '/public' . $uri)) {
    return false;
}

// All other routes go to index.php (Laravel handles routing)
require_once __DIR__ . '/public/index.php';
