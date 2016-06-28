<?php

if (!defined('BASE_PATH')) {
    define('BASE_PATH', __DIR__.'/..');
}

require __DIR__.'/bootstrap.php';

$directusPath = $directus_path = preg_replace('#/(installation/.*)#i', '', $_SERVER['REQUEST_URI']) . '/';
install_directus($directusPath);
