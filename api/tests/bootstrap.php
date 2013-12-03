<?php

namespace ApiTestSuite;

session_start();

// If this file's not there, make one based on config_sample.php
require_once 'config.php';

// Composer Autoloader
$loader = require '../vendor/autoload.php';
$loader->add("Directus\\", __DIR__ . '/../core/');

error_reporting( E_ALL | E_STRICT );
ini_set('display_startup_errors', 1);
ini_set('display_errors', 1);
date_default_timezone_set('America/New_York');

// Non-autoload components (while they still last)
require dirname(__FILE__) . '/../core/db.php';
require dirname(__FILE__) . '/../core/functions.php';

require 'DirectusApiTestCase.php';