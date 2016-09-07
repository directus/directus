<?php

$loader = require __DIR__ . '/vendor/autoload.php';

if (!defined('BASE_PATH')) {
    define('BASE_PATH', __DIR__);
}

if (!defined('STATUS_COLUMN_NAME')) {
    define('STATUS_COLUMN_NAME', 'active');
}
