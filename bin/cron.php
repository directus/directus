<?php

(PHP_SAPI !== 'cli' || isset($_SERVER['HTTP_USER_AGENT'])) && die('Cron Job: comment out the first line in the cron.php file to be able to run from browser');

define('BASE_PATH', realpath(__DIR__ . '/../'));
define('CRON_PATH', realpath(BASE_PATH . '/customs/cron'));
define('LOG_PATH', realpath(BASE_PATH . '/storage'));

// Composer Autoloader
$loader = require BASE_PATH . '/vendor/autoload.php';
require_once BASE_PATH . '/api/config.php';
require CRON_PATH . '/CronJob.php';
require __DIR__ . '/log.php';

use Directus\Bootstrap;
use Directus\Collection;
use Directus\Util\StringUtils;
use Directus\Database\TableSchema;
use Directus\Database\TableGatewayFactory;
use Directus\Database\TableGateway\BaseTableGateway;

$container = new \Slim\Helper\Set();
$container->singleton('zendDb', function () {
    return Bootstrap::get('ZendDb');
});
$container->singleton('log', function () {
    return new Log('cron');
});
$container->singleton('hookEmitter', function () {
    return Bootstrap::get('hookEmitter');
});

TableSchema::setConnectionInstance($container->get('zendDb'));
TableSchema::setConfig(Bootstrap::get('config'));
BaseTableGateway::setHookEmitter($container->get('hookEmitter'));
TableGatewayFactory::setContainer($container);

$container->set('schemaManager', Bootstrap::get('schemaManager'));

$log = $container->get('log');

if (!function_exists('should_execute')) {
    eval('$minuteOfDay = ' . date('z*1440+G*60+i;'));
    function shouldExecute($minutes) {
        global $minuteOfDay;
        if (!$minutes || is_nan($minutes)) return false;
        $match = $minuteOfDay/$minutes;
        return floor($match) == $match;
    }
}

/**
* Find and execute all cron jobs
*/
try {

    if (!file_exists(CRON_PATH)) {
        throw new \Exception('Directory does not exist');
    }

    $cron_jobs = find_php_files(CRON_PATH, true);

    if (!count($cron_jobs)) throw new \Exception('No cron jobs found');

    $jobs = array();
    foreach($cron_jobs as $file) {
        $name = basename($file, '.php');
        if (StringUtils::startsWith($name, '_') || $name == 'CronJob') {
            continue;
        }
        try {
            require_once (CRON_PATH . '/' . $name . '.php');
            $job = "\\Directus\\Customs\\Cron\\".$name;
            if (shouldExecute($job::executeEvery())) {
                $do = new $job();
                $do->exec($container);
            }
        } catch (\Exception $e) {
            $msg = $name . ' threw Exception: ' . $e->getMessage();
            print_r($msg);
            $log->warn($msg);
        }
    }
} catch (\Exception $e) {
    print_r($e->getMessage());
    $log->error($e->getMessage());
    die;
}
