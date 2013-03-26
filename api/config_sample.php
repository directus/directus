<?PHP

date_default_timezone_set('America/New_York');

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