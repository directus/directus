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


// ==================================================================
// @todo: this is a hack! we need to decouple preferences from tables
// and exclude schemas for directus_ tables
$data['tables'] = array();
$data['preferences'] = array();
$tables = $db->get_tables();
foreach ($tables as $table) {
	$tableName = $table['schema']['id'];

	//decouple preferences
	$data['preferences'][] = $table['preferences'];
	unset($table['preferences']);

	//skip directus tables
	if ('directus_' === substr($tableName,0,9) && 'directus_users' !== $tableName) {
		continue;
	}

	$data['tables'][] = $table;
}

// ==================================================================


$data['users'] = $db->get_entries("directus_users", array('perPage'=>99999,'active'=>1));


$data['groups'] = $db->get_entries("directus_groups");
$data['settings'] = $db->get_settings('global');
$data['active_media'] = $db->count_active('directus_media');
$data['authenticatedUser'] = AuthProvider::loggedIn() ? AuthProvider::getUserInfo() : array();

// @todo: maybe the $data['authenticatedUser'] could also provide group?
function getGroupId() {
	global $data;
	$userId = $data['authenticatedUser']['id'];

	foreach ($data['users']['rows'] as $user) {
		if ($user['id'] == $userId) return $user['group']['id'];
	}
}

// @todo: do a real mysql query instead
function getMyTabPrivileges($tabPermissions, $groupId) {
	foreach ($tabPermissions['rows'] as $row) {
		if ($row['group_id'] == $groupId) return $row;
	}
	return array();
}

// @todo: do a real mysql query instead
function getMyPrivileges($privileges, $groupId) {
	return array_filter($privileges['rows'], function($row) use ($groupId) {
		return ($row['group_id'] == $groupId);
		//if ($row['group_id'] == $groupId) return $row;
	});
}

// @todo: this is a very sloppy and temporary solution
// bake it into Bootstrap?
function filterPermittedExtensions($extensions, $blacklist) {

	$blacklistArray = explode(',', $blacklist);

	$permittedExtensions = array_filter($extensions, function($item) use ($blacklistArray) {
		//@todo: id's should be a bit more sophisticated than this
		$path = explode('/',$item);
		$extensionId = $path[1];

		return !in_array($extensionId, $blacklistArray);
	});

	return array_values($permittedExtensions);
}


$groupId = getGroupId();
$data['tab_privileges'] = getMyTabPrivileges($db->get_entries('directus_tab_privileges'), $groupId);


// Encode these as JSON arrays, not as objects.
$data['extensions'] = array_values(Bootstrap::get('extensions'));
$data['privileges'] = getMyPrivileges($db->get_entries("directus_privileges"),$groupId);

if (array_key_exists('tab_blacklist',$data['tab_privileges'])) {
	$data['extensions'] = filterPermittedExtensions($data['extensions'], $data['tab_privileges']['tab_blacklist']);
}

$data['ui'] = array_values(Bootstrap::get('uis'));

$data = json_encode($data);
//if('production' !== DIRECTUS_ENV) {
//	$data = JsonView::format_json($data);
//}

$templateVars = array(
	'data'=> $data,
	'path'=> DIRECTUS_PATH,
	'customFooterHTML' => ''
);

if(file_exists('./customFooterHTML.html')) {
	$templateVars['customFooterHTML'] = file_get_contents('./customFooterHTML.html');
}

echo template(file_get_contents('main.html'), $templateVars);
