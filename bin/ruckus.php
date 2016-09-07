#!/usr/bin/env php
<?php
define('ROOTPATH', dirname(dirname(__FILE__)));
error_reporting(0);

$loader = require ROOTPATH . '/vendor/autoload.php';
$loader->add('Ruckusing', ROOTPATH . '/vendor/ruckusing/ruckusing-migrations/lib/');

use Ruckusing\FrameworkRunner as Ruckusing_Framework;

require ROOTPATH . '/api/config.php';
$config = require ROOTPATH . '/api/ruckusing.conf.php';

$argv = $_SERVER['argv'];
$migrationDirectory = 'schema';
if ($argv[1] == 'db:upgrade') {
    $argv[1] = 'db:migrate';
    $migrationDirectory = 'upgrades';
}

$dbconfig = getDatabaseConfig(['directory' => $migrationDirectory]);
$config = array_merge($config, $dbconfig);

$main = new Ruckusing_Framework($config, $argv);
$output = $main->execute();
echo $output;
