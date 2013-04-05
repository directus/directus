<?php

use Directus\Auth\Provider as AuthProvider;
use Directus\Auth\RequestNonceProvider;
use Directus\Bootstrap;

/**
 * Initialization
 *  - Apparently the autoloaders must be registered separately in both index.php and api.php
 */

// Composer Autoloader
require 'api/vendor/autoload.php';

// Directus Autoloader
// require 'api/Directus/autoload.php';
use Symfony\Component\ClassLoader\UniversalClassLoader;
$loader = new UniversalClassLoader();
$loader->registerNamespace("Directus", dirname(__FILE__) . "/api/core/");
$loader->register();

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
$data['settings'] = $db->get_settings('global');

$data['page'] = '#tables';
$data['path'] = DIRECTUS_PATH;
$data['active_media'] = $db->count_active('directus_media');

// Force array json encoding
$data['extensions'] = array_values(Bootstrap::get('extensions'));
$data['ui'] = array_values(Bootstrap::get('uis'));

echo template(file_get_contents('main.html'), array(
	'data'=> json_encode($data),
	'path'=> DIRECTUS_PATH
));
