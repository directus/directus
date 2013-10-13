<?php

date_default_timezone_set('America/New_York');

define('API_VERSION', 1);

/**
 * DIRECTUS_ENV - Possible values:
 *
 *   'production' => error suppression, nonce protection
 *   'development' => no error suppression, no nonce protection (allows manual viewing of API output)
 *   'staging' => no error suppression, no nonce protection (allows manual viewing of API output)
 *   'development_enforce_nonce' => no error suppression, nonce protection
 */
define('DIRECTUS_ENV', 	'development');

// MySQL Settings
define('DB_HOST',        'localhost');
define('DB_NAME',        'directus');
define('DB_USER',        '');
define('DB_PASSWORD',    '');
define('DB_PREFIX',      '');

// Url path to Directus
define('DIRECTUS_PATH', '/directus/');

// Absolute path to application
define('APPLICATION_PATH', realpath(dirname(__FILE__) . '/..'));