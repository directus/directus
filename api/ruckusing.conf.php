<?php
date_default_timezone_set('UTC');

//----------------------------
// DATABASE CONFIGURATION
//----------------------------

define('RUCKUSING_TS_SCHEMA_TBL_NAME', 'directus_schema_migrations');
define('RUCKUSING_WORKING_BASE', '');

function getDatabaseConfig($config = array()) {
    $db = array(
        'env'  => defined('DIRECTUS_ENV') ? DIRECTUS_ENV : 'development',
        'host' => defined('DB_HOST') ? DB_HOST : 'localhost',
        'name' => defined('DB_NAME') ? DB_NAME : 'directus',
        'user' => defined('DB_USER') ? DB_USER : 'root',
        'pass' => defined('DB_PASSWORD') ? DB_PASSWORD : '',
        //'charset' => 'utf8',
        'directory' => 'directus',
        //'socket' => '/var/run/mysqld/mysqld.sock'
    );

    if($config) {
        $db = array_merge($db, $config);
    }

    return array(
        'db' => array(
            $db['env'] => array(
                'type' => 'mysql',
                'host' => $db['host'],
                'port' => 3306,
                'database' => $db['name'],
                'user' => $db['user'],
                'password' => $db['pass'],
                'directory' => $db['directory']
            )
        )
    );
}

/*

Valid types (adapters) are Postgres & MySQL:

'type' must be one of: 'pgsql' or 'mysql' or 'sqlite'

*/
return array(
    'migrations_dir' => array('default' => dirname(__FILE__) . DIRECTORY_SEPARATOR . 'migrations'),
    'db_dir' => dirname(__FILE__) . DIRECTORY_SEPARATOR . 'logs' . DIRECTORY_SEPARATOR . 'db',
    'log_dir' => dirname(__FILE__) . DIRECTORY_SEPARATOR . 'logs',
    'ruckusing_base' => dirname(__FILE__) . DIRECTORY_SEPARATOR . 'vendor/ruckusing/ruckusing-migrations'
);
