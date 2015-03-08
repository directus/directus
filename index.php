<?php

//If config file doesnt exist, go to install file
if(!file_exists('api/config.php') || filesize('api/config.php') == 0) {
  header('Location: installation/index.php');
}

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
use Directus\Db\TableGateway\DirectusBookmarksTableGateway;
use Directus\Db\TableGateway\DirectusPreferencesTableGateway;
use Directus\Db\TableGateway\DirectusSettingsTableGateway;
use Directus\Db\TableGateway\DirectusTabPrivilegesTableGateway;
use Directus\Db\TableGateway\DirectusPrivilegesTableGateway;
use Directus\Db\TableGateway\DirectusMessagesTableGateway;
use Directus\Db\TableSchema;

// No access, forward to login page
unset($_SESSION['_directus_login_redirect']);
if (!AuthProvider::loggedIn()) {
    $redirect = $_SESSION['_directus_login_redirect'] = urlencode($_SERVER['REQUEST_URI']);
    header('Location: ' . DIRECTUS_PATH . 'login.php?redirect=' . $redirect );
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
    $userColumns = array("activity", "avatar", "name", "id", "active", "first_name", "last_name", "email", "email_messages", "password", "salt", "token", "reset_token", "reset_expiration", "last_login", "last_page", "ip", "group");

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
    return $tableGateway->getEntries(
        array(
            'table_name'=>'directus_users',
            'perPage'=>1000,
            STATUS_COLUMN_NAME=>STATUS_ACTIVE_NUM,
            'columns_visible'=>array(STATUS_COLUMN_NAME,'avatar', 'first_name', 'last_name', 'group', 'email', 'position', 'last_access')
        )
    );
}

function getCurrentUserInfo($users) {
    global $authenticatedUser;
    $data = array_filter($users['rows'], function ($item) use ($authenticatedUser) {
        return ($item['id'] == $authenticatedUser['id']);
    });
    return reset($data);
}

function getBookmarks() {
  global $ZendDb, $acl, $authenticatedUser;
  $bookmarks = new DirectusBookmarksTableGateway($acl, $ZendDb);
  return $bookmarks->fetchAllByUser($authenticatedUser['id']);
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

function getActiveFiles() {
    global $ZendDb, $acl;
    $tableGateway = new TableGateway($acl, 'directus_files', $ZendDb);
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

function getPrivileges($groupId) {
    global $ZendDb, $acl;
    $tableGateway = new DirectusPrivilegesTableGateway($acl, $ZendDb);
    return $tableGateway->fetchGroupPrivilegesRaw($groupId);
}

function getUI() {
    $uis = array_values(Bootstrap::get('uis'));
    // Add full path
    foreach ($uis as &$ui) {
        $ui = DIRECTUS_PATH . $ui . '.js';
    }

    return $uis;
}

function getListViews() {
    return Bootstrap::get('listViews');
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
    return DIRECTUS_PATH . 'assets/css/directus.css';
}

// ---------------------------------------------------------------------

/**
 * Optionally force HTTPS
 */

$config = Bootstrap::get('config');
$forceHttps = isset($config['HTTP']) && isset($config['HTTP']['forceHttps'])
    && $config['HTTP']['forceHttps'];
if($forceHttps) {
    $isHttpsFallbackFn = function () {
        return isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off';
    };
    $isHttpsFn = isset($config['HTTP']['isHttpsFn']) ?
        $config['HTTP']['isHttpsFn'] : $isHttpsFallbackFn;
    if(!$isHttpsFn()) {
        $host = 'https://' . $_SERVER['SERVER_NAME'];
        if('80' != $_SERVER['SERVER_PORT']) {
            $host .= ":" . $_SERVER['SERVER_PORT'];
        }
        $httpsUrl = $host . $_SERVER['REQUEST_URI'];
        header('Location: ' . $httpsUrl);
        exit;
    }
}

$users = getUsers();
$currentUserInfo = getCurrentUserInfo($users);

// Cache buster
$git = __DIR__ . '/.git';
$cacheBuster = Directus\Util\Git::getCloneHash($git);

$tableSchema = TableSchema::getAllSchemas($currentUserInfo['group']['id'], $cacheBuster);

$tabPrivileges = getTabPrivileges(($currentUserInfo['group']['id']));
$groupId = $currentUserInfo['group']['id'];

$statusMapping = array('active_num'=>STATUS_ACTIVE_NUM, 'deleted_num'=>STATUS_DELETED_NUM, 'status_name'=>STATUS_COLUMN_NAME);;
$statusMapping['mapping'] = $config['statusMapping'];

$data = array(
    'cacheBuster' => $cacheBuster,
    'nonces' => getNonces(),
    'storage_adapters' => getStorageAdapters(),
    'path' => DIRECTUS_PATH,
    'page' => '#tables',
    'tables' => parseTables($tableSchema),
    'preferences' => parsePreferences($tableSchema), //ok
    'users' => $users,
    'groups' => getGroups(),
    'settings' => getSettings(),
    'active_files' => getActiveFiles(),
    'authenticatedUser' => $authenticatedUser,
    'tab_privileges' => $tabPrivileges,
    'extensions' => getExtensions($tabPrivileges),
    'privileges' => getPrivileges($groupId),
    'ui' => getUI(),
    'listViews' => getListViews(),
    'messages' => getInbox(),
    'bookmarks' => getBookmarks(),
    'extendedUserColumns' => getExtendedUserColumns($tableSchema),
    'statusMapping' => $statusMapping
);

$templateVars = array(
    'cacheBuster' => $cacheBuster,
    'data' => json_encode($data),
    'path' => DIRECTUS_PATH,
    'customFooterHTML' => getCusomFooterHTML(),
    'cssFilePath' => getCSSFilePath(),
    'cms_color' => '#89c33d'
);

if(isset($data['settings']) && isset($data['settings'][0]) && isset($data['settings'][0]['cms_color'])) {
  $templateVars['cms_color'] = $data['settings'][0]['cms_color'];
}

echo template(file_get_contents('main.html'), $templateVars);
