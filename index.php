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
$data['settings'] = $db->get_settings('global');
$data['page'] = '#tables';
$data['path'] = DIRECTUS_PATH;
$data['active_media'] = $db->count_active('directus_media');


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
$data['extensions'] = array_values(Bootstrap::get('extensions'));
$data['privileges'] = getMyPrivileges($db->get_entries("directus_privileges"),$groupId);

if (array_key_exists('tab_blacklist',$data['tab_privileges'])) {
	$data['extensions'] = filterPermittedExtensions($data['extensions'], $data['tab_privileges']['tab_blacklist']);
}

$data['ui'] = array_values(Bootstrap::get('uis'));

$data = json_encode($data);
if('production' !== DIRECTUS_ENV)
	$data = JsonView::format_json($data);

echo template(file_get_contents('main.html'), array(
	'data'=> $data,
	'path'=> DIRECTUS_PATH
));
