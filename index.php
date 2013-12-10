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
use Directus\Db\TableGateway\RelationalTableGatewayWithConditions as TableGateway;
use Directus\Db\TableGateway\DirectusPreferencesTableGateway;
use Directus\Db\TableGateway\DirectusSettingsTableGateway;
use Directus\Db\TableGateway\DirectusTabPrivilegesTableGateway;
use Directus\Db\TableGateway\DirectusPrivilegesTableGateway;
use Directus\Db\TableGateway\DirectusMessagesTableGateway;
use Directus\Db\TableSchema;

// No access, forward to login page
if (!AuthProvider::loggedIn()) {
	header('Location: ' . DIRECTUS_PATH . 'login.php');
	die();
}

$acl = Bootstrap::get('acl');
$ZendDb = Bootstrap::get('ZendDb');
$authenticatedUser = AuthProvider::loggedIn() ? AuthProvider::getUserInfo() : array();

function getNonces() {
	$requestNonceProvider = new RequestNonceProvider();

	$nonces = array_merge($requestNonceProvider->getOptions(), array(
		'pool' => $requestNonceProvider->getAllNonces()
	));

	return $nonces;
};

function getStorageAdapters() {
	global $ZendDb, $acl;
	$DirectusStorageAdaptersTableGateway = new DirectusStorageAdaptersTableGateway($acl, $ZendDb);
	$storageAdapters = $DirectusStorageAdaptersTableGateway->fetchAllByIdNoParams();
	$adaptersByUniqueRole = array();
	foreach($storageAdapters as $adapter) {
		if(!empty($adapter['role'])) {
			$storageAdapters[$adapter['role']] = $adapter;
		}
	}
	return $storageAdapters;
}

function parseTables($tableSchema) {
	$tables = array();

	foreach ($tableSchema as $table) {
		$tableName = $table['schema']['id'];

		//remove preferences
		unset($table['preferences']);

		//skip directus tables
		if ('directus_' === substr($tableName,0,9) && 'directus_messages_recipients' !== $tableName) {
			continue;
		}

		$tables[] = $table;
	}

	return $tables;
}

function getExtendedUserColumns($tableSchema) {
	$userColumns = array("activity", "avatar", "name", "id", "active", "first_name", "last_name", "email", "email_messages", "password", "salt", "token", "reset_token", "reset_expiration", "description", "last_login", "last_page", "ip", "group");

	$schema = array_filter($tableSchema, function($table) {
		return $table['schema']['id'] === 'directus_users';
	});

	$schema = reset($schema);

	$columns = array_filter($schema['schema']['columns'], function($column) use ($userColumns) {
		return !in_array($column['id'], $userColumns);
	});

	return array_values($columns);

}

function parsePreferences($tableSchema) {
	$preferences = array();

	foreach ($tableSchema as $table) {
		$preferences[] = $table['preferences'];
	}

	return $preferences;
}

function getUsers() {
	global $ZendDb, $acl;
	$tableGateway = new TableGateway($acl, 'directus_users', $ZendDb);
	return $tableGateway->getEntries(array('table_name'=>'directus_users','perPage'=>1000, 'active'=>1));
}

function getCurrentUserInfo($users) {
	global $authenticatedUser;
	$data = array_filter($users['rows'], function ($item) use ($authenticatedUser) {
    	return ($item['id'] == $authenticatedUser['id']);
	});
	return reset($data);
}

function getGroups() {
	global $ZendDb, $acl;
	$groups = new TableGateway($acl, 'directus_groups', $ZendDb);
	return $groups->getEntries();
}

function getSettings() {
	global $ZendDb, $acl;
	$settings = new DirectusSettingsTableGateway($acl, $ZendDb);
	$items = array();
	foreach ($settings->fetchAll() as $key => $value) {
		$value['id'] = $key;
		$items[] = $value;
	};

	return $items;
}

function getActiveMedia() {
	global $ZendDb, $acl;
	$tableGateway = new TableGateway($acl, 'directus_media', $ZendDb);
	return $tableGateway->countActive();
}

function getTabPrivileges($groupId) {
	global $ZendDb, $acl;
	$tableGateway = new DirectusTabPrivilegesTableGateway($acl, $ZendDb);
	return $tableGateway->fetchAllByGroup($groupId);
}

function getInbox() {
	global $ZendDb, $acl, $authenticatedUser;
	$tableGateway = new DirectusMessagesTableGateway($acl, $ZendDb);
	return $tableGateway->fetchMessagesInboxWithHeaders($authenticatedUser['id']);
}

// @todo: this is a quite sloppy and temporary solution
// bake it into Bootstrap?
function filterPermittedExtensions($extensions, $blacklist) {

	$blacklistArray = explode(',', $blacklist);

	$permittedExtensions = array_filter($extensions, function($item) use ($blacklistArray) {
		//@todo: id's should be a bit more sophisticated than this
		$path = explode('/', $item);
		$extensionId = $path[1];

		return !in_array($extensionId, $blacklistArray);
	});

	return array_values($permittedExtensions);
}

function getExtensions($tabPrivileges) {

	$extensions = array_values(Bootstrap::get('extensions'));

	// filter out tabs that aren't visible
	if (array_key_exists('tab_blacklist', $tabPrivileges)) {
		$extensions = filterPermittedExtensions($extensions, $tabPrivileges['tab_blacklist']);
	}

	// Append relative path and filename for dynamic loading
	foreach ($extensions as &$extension) {
		$extension = DIRECTUS_PATH . $extension . '.js';
	};

	return $extensions;
}

function getPrivileges() {
	global $ZendDb, $acl;
	$tableGateway = new DirectusPrivilegesTableGateway($acl, $ZendDb);
	return $tableGateway->fetchGroupPrivilegesRaw(0);
}

function getUI() {
	$uis = array_values(Bootstrap::get('uis'));
	// Add full path
	foreach ($uis as &$ui) {
		$ui = DIRECTUS_PATH . $ui . '.js';
	}

	return $uis;
}

function getCusomFooterHTML() {
	if(file_exists('./customFooterHTML.html')) {
		return file_get_contents('./customFooterHTML.html');
	}
	return '';
}

function getCSSFilePath() {
	if(file_exists('./assets/css/custom.css')) {
		return DIRECTUS_PATH . 'assets/css/custom.css';
	}
	return DIRECTUS_PATH . 'assets/css/index.css';
}

// ---------------------------------------------------------------------

$tableSchema = TableSchema::getTables();
$users = getUsers();
$currentUserInfo = getCurrentUserInfo($users);
$tabPrivileges = getTabPrivileges(($currentUserInfo['group']['id']));

$data = array(
	'nonces' => getNonces(),
	'storage_adapters' => getStorageAdapters(),
	'path' => DIRECTUS_PATH,
	'page' => '#tables',
	'tables' => parseTables($tableSchema),
	'preferences' => parsePreferences($tableSchema), //ok
	'users' => $users,
	'groups' => getGroups(),
	'settings' => getSettings(),
	'active_media' => getActiveMedia(),
	'authenticatedUser' => $authenticatedUser,
	'tab_privileges' => $tabPrivileges,
	'extensions' => getExtensions($tabPrivileges),
	'privileges' => getPrivileges(),
	'ui' => getUI(),
	'messages' => getInbox(),
	'extendedUserColumns' => getExtendedUserColumns($tableSchema)
);

$templateVars = array(
	'data' => json_encode($data),
	'path' => DIRECTUS_PATH,
	'customFooterHTML' => getCusomFooterHTML(),
	'cssFilePath' => getCSSFilePath()
);

echo template(file_get_contents('main.html'), $templateVars);

?>