<?PHP

date_default_timezone_set('America/New_York');

/**
 * DIRECTUS_ENV - Possible values:
 *
 *   'production' => error suppression, nonce protection
 *   'development' => no error suppression, no nonce protection (allows manual viewing of API output)
 *   'development_enforce_nonce' => no error suppression, nonce protection
 */
define('DIRECTUS_ENV', 'production');

// MySQL Settings
define('DB_HOST', 			'');
define('DB_NAME', 			'');
define('DB_USER', 			'');
define('DB_PASSWORD', 	'');
define('DB_PREFIX', 		'');

// Url path to Directus
define('DIRECTUS_PATH', '/directus/');

// Absolute path to application
define('APPLICATION_PATH', realpath(dirname(__FILE__) . '/..'));

// Full path to the static resources directory.
// E.g: /Users/olov/MAMP/resources/
// Add 'temp' and 'thumbnail' directories in the resources directory
define('RESOURCES_PATH', '');

define('API_VERSION', 1);