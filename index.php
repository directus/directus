<?php

// Composer Autoloader
$loader = require 'api/vendor/autoload.php';
$loader->add("Directus", dirname(__FILE__) . "/api/core/");

// Non-autoloaded components
require 'api/api.php';

use Directus\View\JsonView;
use Directus\Auth\Provider as AuthProvider;
use Directus\Auth\RequestNonceProvider;
use Directus\Bootstrap;
use Directus\Db\TableGateway\DirectusStorageAdaptersTableGateway;

// No access, forward to login page
if (!AuthProvider::loggedIn()) {
	header('Location: ' . DIRECTUS_PATH . 'login.php');
	die();
}

$acl = Bootstrap::get('acl');
$ZendDb = Bootstrap::get('ZendDb');

$data = array();

$requestNonceProvider = new RequestNonceProvider();
$data['nonces'] = array_merge($requestNonceProvider->getOptions(), array(
	'pool' => $requestNonceProvider->getAllNonces()
));

$DirectusStorageAdaptersTableGateway = new DirectusStorageAdaptersTableGateway($acl, $ZendDb);
$data['storage_adapters'] = $DirectusStorageAdaptersTableGateway->fetchAllByIdNoParams();
$adaptersByUniqueRole = array();
foreach($data['storage_adapters'] as $adapter) {
	if(!empty($adapter['role'])) {
		$adaptersByUniqueRole[$adapter['role']] = $adapter;
	}
}
$data['storage_adapters'] = array_merge($data['storage_adapters'], $adaptersByUniqueRole);

$data['path'] = DIRECTUS_PATH;
$data['page'] = '#tables';
$data['tables'] = $db->get_tables();
$data['users'] = $db->get_users();
$data['groups'] = $db->get_entries("directus_groups");
$data['privileges'] = $db->get_entries("directus_privileges");
$data['settings'] = $db->get_settings('global');
$data['active_media'] = $db->count_active('directus_media');
$data['authenticatedUser'] = AuthProvider::loggedIn() ? AuthProvider::getUserInfo() : array();

// Encode these as JSON arrays, not as objects.
$data['extensions'] = array_values(Bootstrap::get('extensions'));
$data['ui'] = array_values(Bootstrap::get('uis'));

$data = json_encode($data);
if('production' !== DIRECTUS_ENV) {
	$data = JsonView::format_json($data);
}

echo template(file_get_contents('main.html'), array(
	'data'=> $data,
	'path'=> DIRECTUS_PATH
));
