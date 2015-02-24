#!/usr/bin/env php
<?php
define('ROOTPATH', dirname(dirname(__FILE__)));
error_reporting(0);

$loader = require ROOTPATH . '/api/vendor/autoload.php';
$loader->add("Ruckusing", ROOTPATH . "/api/vendor/ruckusing/ruckusing-migrations/lib/");

use Ruckusing\FrameworkRunner as Ruckusing_Framework;

require ROOTPATH . '/api/config.php';
$config = require ROOTPATH . '/api/ruckusing.conf.php';
$config['db']['development'] = array(
  'type' => 'mysql',
  'host' => DB_HOST,
  'port' => 3306,
  'database' => DB_NAME,
  'user' => DB_USER,
  'password' => DB_PASSWORD
);

$main = new Ruckusing_Framework($config, $_SERVER['argv']);
$output = $main->execute();
echo $output;