<?php

namespace ApiTestSuite;

session_start();

// If this file's not there, make one based on config_sample.php
require_once 'config.php';

// Composer Autoloader
require '../vendor/autoload.php';

error_reporting( E_ALL | E_STRICT );
ini_set('display_startup_errors', 1);
ini_set('display_errors', 1);
date_default_timezone_set('America/New_York');

// Directus Core Autoloader
use Symfony\Component\ClassLoader\UniversalClassLoader;
$loader = new UniversalClassLoader();
$loader->registerNamespace('Directus', dirname(__FILE__) . '/../core/');
$loader->register();

// Non-autoload components (while they still last)
require dirname(__FILE__) . '/../core/db.php';
require dirname(__FILE__) . '/../core/media.php';
require dirname(__FILE__) . '/../core/functions.php';

require 'DirectusApiTestCase.php';