<?php

// Composer Autoloader
$loader = require __DIR__ . '/../api/vendor/autoload.php';
$loader->add("Directus", __DIR__ . '/../api/core/');

// Non-autoload components
require __DIR__ . '/../api/config.php';
require __DIR__ . '/../api/core/db.php';
require __DIR__ . '/../api/core/functions.php';

// Define directus environment
defined('DIRECTUS_ENV')
    || define('DIRECTUS_ENV', (getenv('DIRECTUS_ENV') ? getenv('DIRECTUS_ENV') : 'production'));

switch (DIRECTUS_ENV) {
    case 'development_enforce_nonce':
    case 'development':
    case 'staging':
        break;
    case 'production':
    default:
        error_reporting(0);
        break;
}

$isHttps = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off';
$host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
$url = ($isHttps ? 'https' : 'http') . '://' . $host;
define('HOST_URL', $url);