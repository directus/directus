<?php
//----------------------------
// DATABASE CONFIGURATION
//----------------------------

if (!defined('RUCKUSING_TS_SCHEMA_TBL_NAME')) {
    define('RUCKUSING_TS_SCHEMA_TBL_NAME', 'directus_schema_migrations');
}

if (!defined('RUCKUSING_WORKING_BASE')) {
    define('RUCKUSING_WORKING_BASE', '');
}

if (!function_exists('getDatabaseConfig')) {
    function getDatabaseConfig($config = [])
    {
        $db = [
            'env' => defined('DIRECTUS_ENV') ? DIRECTUS_ENV : 'development',
            'type' => defined('DB_TYPE') ? DB_TYPE : 'mysql',
            'host' => defined('DB_HOST') ? DB_HOST : 'localhost',
            'port' => defined('DB_PORT') ? DB_PORT : 3306,
            'name' => defined('DB_NAME') ? DB_NAME : 'directus',
            'user' => defined('DB_USER') ? DB_USER : 'root',
            'pass' => defined('DB_PASSWORD') ? DB_PASSWORD : '',
            'prefix' => defined('DB_PREFIX') ? DB_PREFIX : '',
            'engine' => defined('DB_ENGINE') ? DB_ENGINE : 'InnoDB',
            'charset' => defined('DB_CHARSET') ? DB_CHARSET : 'utf8mb4',
            'directory' => 'schema',
            //'socket' => '/var/run/mysqld/mysqld.sock'
        ];

        if ($config) {
            $db = array_merge($db, $config);
        }

        return [
            'db' => [
                $db['env'] => [
                    'type' => $db['type'],
                    'host' => $db['host'],
                    'port' => $db['port'],
                    'database' => $db['name'],
                    'user' => $db['user'],
                    'password' => $db['pass'],
                    'charset' => $db['charset'],
                    'engine' => $db['engine'],
                    'directory' => $db['directory']
                ]
            ],
            'prefix' => $db['prefix']
        ];
    }
}
/*

Valid types (adapters) are Postgres & MySQL:

'type' must be one of: 'pgsql' or 'mysql' or 'sqlite'

*/
return [
    'migrations_dir' => [
        'default' => dirname(__FILE__) . DIRECTORY_SEPARATOR . 'migrations',
        'customs' => dirname(dirname(__FILE__)) . DIRECTORY_SEPARATOR . 'customs' . DIRECTORY_SEPARATOR. 'migrations'
    ],
    'db_dir' => dirname(__FILE__) . DIRECTORY_SEPARATOR . 'logs' . DIRECTORY_SEPARATOR . 'db',
    'log_dir' => dirname(__FILE__) . DIRECTORY_SEPARATOR . 'logs',
    'ruckusing_base' => dirname(__FILE__) . DIRECTORY_SEPARATOR . 'vendor/ruckusing/ruckusing-migrations'
];
