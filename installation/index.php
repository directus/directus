<?php

if (!defined('BASE_PATH')) {
    define('BASE_PATH', __DIR__ . '/..');
}

require __DIR__ . '/bootstrap.php';

$directusPath = $directus_path = get_directus_path();
install_directus($directusPath);
