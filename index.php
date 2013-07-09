<?php

// Initialization
// - Apparently the autoloaders must be registered separately in both index.php and api.php

// Exceptional.io error handling
if(defined('EXCEPTIONAL_API_KEY')) {
    require_once 'api/vendor-manual/exceptional-php/exceptional.php';
    Exceptional::setup(EXCEPTIONAL_API_KEY);
}

// Composer Autoloader
require 'api/vendor/autoload.php';

// Directus Autoloader
use Symfony\Component\ClassLoader\UniversalClassLoader;
$loader = new UniversalClassLoader();
$loader->registerNamespace("Directus", dirname(__FILE__) . "/api/core/");
$loader->register();

use Directus\View\JsonView;
use Directus\Auth\Provider as AuthProvider;
use Directus\Auth\RequestNonceProvider;
use Directus\Bootstrap;

// Non-autoloaded components
require 'api/api.php';

// No access, forward to login page
if (!AuthProvider::loggedIn()) {
  header( 'Location: ' . DIRECTUS_PATH . 'login.php' ) ;
  die();
}

$data = array();

$requestNonceProvider = new RequestNonceProvider();
$data['nonces'] = array_merge($requestNonceProvider->getOptions(), array(
	'pool' => $requestNonceProvider->getAllNonces()
));

$data['authenticatedUser'] = AuthProvider::loggedIn() ? AuthProvider::getUserInfo() : array();
$data['tables'] = $db->get_tables();
$data['users'] = $db->get_users();
$data['groups'] = $db->get_entries("directus_groups");
$data['privileges'] = $db->get_entries("directus_privileges");
$data['settings'] = $db->get_settings('global');

$data['page'] = '#tables';
$data['path'] = DIRECTUS_PATH;
$data['active_media'] = $db->count_active('directus_media');

// Force array json encoding
$data['extensions'] = array_values(Bootstrap::get('extensions'));
$data['ui'] = array_values(Bootstrap::get('uis'));

$data = json_encode($data);
if('production' !== DIRECTUS_ENV)
	$data = JsonView::format_json($data);

echo template(file_get_contents('main.html'), array(
	'data'=> $data,
	'path'=> DIRECTUS_PATH
));
