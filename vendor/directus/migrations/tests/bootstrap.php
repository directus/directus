<?php

//set up some preliminary defaults, this is so all of our framework includes work

define('RUCKUSING_WORKING_BASE', dirname(__FILE__) . DIRECTORY_SEPARATOR . 'dummy' . DIRECTORY_SEPARATOR . 'db');

$ruckusing_config = require dirname(__FILE__) . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'database.inc.php';
if (isset($ruckusing_config['ruckusing_base'])) {
    define('RUCKUSING_BASE', $ruckusing_config['ruckusing_base']);
} else {
    define('RUCKUSING_BASE', dirname(__FILE__) . DIRECTORY_SEPARATOR . '..');
}

define('RUCKUSING_TS_SCHEMA_TBL_NAME', 'schema_migrations');

if (!defined('BASE')) {
    define('BASE', dirname(__FILE__));
}

if (!defined('RUCKUSING_TEST_HOME')) {
    define('RUCKUSING_TEST_HOME', RUCKUSING_BASE . DIRECTORY_SEPARATOR . 'tests');
}

spl_autoload_register('loader', true);

set_include_path(
        implode(
                PATH_SEPARATOR,
                array(
                        RUCKUSING_BASE . DIRECTORY_SEPARATOR . 'lib',
                        get_include_path(),
                )
        )
);

function loader($classname)
{
    $filename = RUCKUSING_BASE . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . str_replace('_', DIRECTORY_SEPARATOR, $classname) . '.php';
    if (is_file($filename)) {
        include $filename;
    }
}
