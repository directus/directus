<?php

  $db_host = $_SESSION['host_name'];
  $db_name = $_SESSION['db_name'];
  $db_user = $_SESSION['username'];
  $db_password = $_SESSION['db_password'];
  $db_prefix = '';//$_SESSION['db_prefix'];
  $dirPath = $_SESSION['directus_path'];


  $_SERVER['SERVER_NAME'] = '$_SERVER[\'SERVER_NAME\']';
  $host = '$host';

$configText = "<?php
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
define('DIRECTUS_ENV',  'development');

// MySQL Settings
define('DB_HOST',        '$db_host');
define('DB_NAME',        '$db_name');
define('DB_USER',        '$db_user');
define('DB_PASSWORD',    '$db_password');
define('DB_PREFIX',      '$db_prefix');


define('DB_HOST_SLAVE',        ''); //Leave undefined to fall back on master
define('DB_USER_SLAVE',        '');
define('DB_PASSWORD_SLAVE',    '');

// Url path to Directus
define('DIRECTUS_PATH', '$dirPath');


$host = 'www.example.com'; // (Make it work for CLI)
if(isset(".'$_SERVER[\'SERVER_NAME\']'.")) {
    $host = ".'$_SERVER[\'SERVER_NAME\']'.";
}

define('ROOT_URL', '//' . $host);
if (!defined('ROOT_URL_WITH_SCHEME')){
    //Use this for emailing URLs(links, images etc) as some clients will trip on the scheme agnostic ROOT_URL
    define('ROOT_URL_WITH_SCHEME', 'https://' . $host);
}

// Absolute path to application
define('APPLICATION_PATH', realpath(dirname(__FILE__) . '/..'));

//Memcached Server, operates on default 11211 port.
define('MEMCACHED_SERVER', '127.0.0.1');

//Namespaced the memcached keys so branches/databases to not collide
//options are prod, staging, testing, development
define('MEMCACHED_ENV_NAMESPACE', 'staging');


define('STATUS_DELETED_NUM', 0);
define('STATUS_ACTIVE_NUM', 1);
define('STATUS_COLUMN_NAME', 'active');";


function WriteConfig() {
  global $configText;
  file_put_contents("../api/config.php", $configText);

  $configuration = "<?php

/**
 * High priority use case, not super planned out yet.
 * This will be useful in the future as we do a better job organizing our application configuration.
 * We need to distinguish between configuration and application constants.
 */

return array(

  'session' => array(
    'prefix' =>  'directus6_'
  ),

  'HTTP' => array(
    'forceHttps' => false,
    'isHttpsFn' => function () {
      // Override this check for custom arrangements, e.g. SSL-termination @ load balancer
      return isset(".'$_SERVER[\'HTTPS\']) && $_SERVER[\'HTTPS\']'." != 'off';
    }
  ),

  // Define this to send emails e.g. forgot password
  'SMTP' => array(
    'host' => '',
    'port' => 25,
    'username' => '',
    'password' => ''
  ),

  'dbHooks' => array(
    'postInsert' => function (".'$TableGateway, $record, $db, $acl'.") {

    },
    'postUpdate' => function (".'$TableGateway, $record, $db, $acl'.") {
      ".'$tableName = $TableGateway->getTable()'.";
      switch(".'$tableName'.") {
        // ...
      }
    }
  ),

  // These tables will not be loaded in the directus schema
  'tableBlacklist' => array(

  ),

  'statusMapping' => array(
    '0' => array(
      'name' => 'Delete',
      'color' => '#C1272D',
      'sort' => 3
    ),
    '1' => array(
      'name' => 'Active',
      'color' => '#5B5B5B',
      'sort' => 1
    ),
    '2' => array(
      'name' => 'Draft',
      'color' => '#BBBBBB',
      'sort' => 2
    )
  )

);";

  file_put_contents("../api/configuration.php", $configuration);

}