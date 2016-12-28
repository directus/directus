<?php

//If config file doesnt exist, go to install file
if (!file_exists('api/config.php') || filesize('api/config.php') == 0) {
    header('Location: installation/index.php');
    exit;
}

// Composer Autoloader
$loader = require 'vendor/autoload.php';

// Non-autoloaded components
require 'api/api.php';
require 'api/globals.php';

use Directus\Auth\Provider as AuthProvider;
use Directus\Auth\RequestNonceProvider;
use Directus\Bootstrap;
use Directus\Db\TableGateway\DirectusBookmarksTableGateway;
use Directus\Db\TableGateway\DirectusMessagesTableGateway;
use Directus\Db\TableGateway\DirectusPrivilegesTableGateway;
use Directus\Db\TableGateway\DirectusSettingsTableGateway;
use Directus\Db\TableGateway\DirectusUsersTableGateway;
use Directus\Db\TableGateway\RelationalTableGatewayWithConditions as TableGateway;
use Directus\Db\TableSchema;

$emitter = Bootstrap::get('hookEmitter');

$emitter->run('directus.index.start');

// No access, forward to login page
unset($_SESSION['_directus_login_redirect']);
if (!AuthProvider::loggedIn()) {
    $request_uri = $_SERVER['REQUEST_URI'];
    if (strpos($request_uri, DIRECTUS_PATH) === 0) {
        $request_uri = substr($request_uri, strlen(DIRECTUS_PATH));
    }
    $redirect = htmlspecialchars(trim($request_uri, '/'), ENT_QUOTES, 'UTF-8');
    if ($redirect) {
        $_SESSION['_directus_login_redirect'] = $redirect;
        $redirect = '?redirect=' . $redirect;
    }
    header('Location: ' . DIRECTUS_PATH . 'login.php' . $redirect);
    die();
}

$acl = Bootstrap::get('acl');
$ZendDb = Bootstrap::get('ZendDb');
$authenticatedUser = AuthProvider::loggedIn() ? AuthProvider::getUserInfo() : [];

function getNonces()
{
    $requestNonceProvider = new RequestNonceProvider();
    $nonces = array_merge($requestNonceProvider->getOptions(), [
        'pool' => $requestNonceProvider->getAllNonces()
    ]);

    return $nonces;
}

;

function getStorageAdapters()
{
    $config = Bootstrap::get('config');
    $storageAdapter = $config['filesystem'];

    return [
        $storageAdapter['adapter'] => [
            'adapter' => $storageAdapter['adapter'],
            'root_url' => $storageAdapter['root_url'],
            'root_thumb_url' => $storageAdapter['root_thumb_url']
        ]
    ];
}

function parseTables($tableSchema)
{
    $tables = [];

    foreach ($tableSchema as $table) {
        $tableName = $table['schema']['id'];

        //remove preferences
        unset($table['preferences']);

        //skip directus tables
        if ('directus_' === substr($tableName, 0, 9) && 'directus_messages_recipients' !== $tableName) {
            continue;
        }

        $tables[] = $table;
    }

    return $tables;
}

function getExtendedUserColumns($tableSchema)
{
    $userColumns = ['activity', 'avatar', 'name', 'id', 'active', 'first_name', 'last_name', 'email', 'email_messages', 'password', 'salt', 'token', 'reset_token', 'reset_expiration', 'last_login', 'last_page', 'ip', 'group'];

    $schema = array_filter($tableSchema, function ($table) {
        return $table['schema']['id'] === 'directus_users';
    });

    $schema = reset($schema);

    $columns = array_filter($schema['schema']['columns'], function ($column) use ($userColumns) {
        return !in_array($column['id'], $userColumns);
    });

    return array_values($columns);

}

function parsePreferences($tableSchema)
{
    $preferences = [];

    foreach ($tableSchema as $table) {
        if (isset($table['preferences'])) {
            $preferences[] = $table['preferences'];
        }
    }

    return $preferences;
}

function getUsers()
{
    global $ZendDb, $acl;
    $tableGateway = new TableGateway($acl, 'directus_users', $ZendDb);
    $users = $tableGateway->getEntries([
        'table_name' => 'directus_users',
        'perPage' => 1000,
        STATUS_COLUMN_NAME => STATUS_ACTIVE_NUM,
        'columns_visible' => [STATUS_COLUMN_NAME, 'avatar', 'first_name', 'last_name', 'group', 'email', 'position', 'last_access']
    ]);

    // Lets get the gravatar if no avatar is set.
    // TODO: Add this on insert/update of any user.
    $usersRowsToUpdate = [];
    foreach ($users['rows'] as $user) {
        $hasAvatar = array_key_exists('avatar', $user) ? $user['avatar'] : false;
        $hasEmail = array_key_exists('email', $user) ? $user['email'] : false;
        if (!$hasAvatar && $hasEmail) {
            $avatar = DirectusUsersTableGateway::get_avatar($user['email']);
            if ($avatar) {
                $user['avatar'] = $avatar;
                array_push($usersRowsToUpdate, ['id' => $user['id'], 'avatar' => $user['avatar']]);
            }
        }
    }

    if ($usersRowsToUpdate) {
        $tableGateway->updateCollection($usersRowsToUpdate);
    }

    return $users;
}

function getCurrentUserInfo($users)
{
    global $authenticatedUser;
    $data = array_filter($users['rows'], function ($item) use ($authenticatedUser) {
        return ($item['id'] == $authenticatedUser['id']);
    });

    return reset($data);
}

function getBookmarks()
{
    global $ZendDb, $acl, $authenticatedUser;
    $bookmarks = new DirectusBookmarksTableGateway($acl, $ZendDb);

    return $bookmarks->fetchAllByUser($authenticatedUser['id']);
}

function getGroups()
{
    global $ZendDb, $acl;
    $groups = new TableGateway($acl, 'directus_groups', $ZendDb);
    // @todo: move to DirectusGroupsTableGateway
    $groupEntries = $groups->getEntries();

    $groupEntries['rows'] = array_map(function ($row) {
        if (array_key_exists('nav_override', $row)) {
            if (!empty($row['nav_override'])) {
                $row['nav_override'] = @json_decode($row['nav_override']);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    $row['nav_override'] = false;
                }
            } else {
                $row['nav_override'] = NULL;
            }
        }
        return $row;
    }, $groupEntries['rows']);

    return $groupEntries;
}

function getSettings()
{
    global $ZendDb, $acl;
    $settings = new DirectusSettingsTableGateway($acl, $ZendDb);
    $items = [];
    foreach ($settings->fetchAll() as $key => $value) {
        if ($key == 'global') {
            $value['max_file_size'] = get_max_upload_size();
        }

        $value['id'] = $key;
        $items[] = $value;
    };

    return $items;
}

function getActiveFiles()
{
    global $ZendDb, $acl;
    $tableGateway = new TableGateway($acl, 'directus_files', $ZendDb);

    return $tableGateway->countActive();
}

// function getTabPrivileges($groupId) {
//     global $ZendDb, $acl;
//     $tableGateway = new DirectusTabPrivilegesTableGateway($acl, $ZendDb);
//     return $tableGateway->fetchAllByGroup($groupId);
// }

function getInbox()
{
    global $ZendDb, $acl, $authenticatedUser;
    $tableGateway = new DirectusMessagesTableGateway($acl, $ZendDb);

    return $tableGateway->fetchMessagesInboxWithHeaders($authenticatedUser['id']);
}

/**
 * Get new version notification
 *
 * @return null|array
 */
function getVersionNotification()
{
    $message = null;
    $firstTimeVersionCheck = false;
    if (isset($_SESSION['first_version_check'])) {
        $firstTimeVersionCheck = true;
        unset($_SESSION['first_version_check']);
    }

    // only notify the user every 30 day.
    $data = check_version($firstTimeVersionCheck);
    $session_key = 'version_last_check';
    $lastCheckTime = isset($_SESSION[$session_key]) ? $_SESSION[$session_key] : false;

    if ($lastCheckTime && ($lastCheckTime + 30 * DAY_IN_SECONDS) > gmdate('U')) {
        return $message;
    }

    $_SESSION[$session_key] = gmdate('U');
    if ($data['outdated'] == true) {
        $message = [
            'title' => __t('version_outdated_title'),
            'text' => __t('version_outdated_text_x', [
                'installed_version' => DIRECTUS_VERSION,
                'current_version' => $data['current_version']
            ])
        ];
    }

    return $message;
}

/**
 * Notification messages
 *
 * This notification will be presented to the user when they logged in
 *
 * return array
 */
function getLoginNotification()
{
    $messages = [];

    $versionNotification = getVersionNotification();
    if ($versionNotification) {
        array_push($messages, $versionNotification);
    }

    return $messages;
}

// @todo: this is a quite sloppy and temporary solution
// bake it into Bootstrap?
function filterPermittedExtensions($extensions, $blacklist)
{
    $blacklistArray = explode(',', $blacklist);

    $permittedExtensions = array_filter($extensions, function ($item) use ($blacklistArray) {
        //@todo: id's should be a bit more sophisticated than this
        $path = explode('/', $item);
        $extensionId = $path[1];

        return !in_array($extensionId, $blacklistArray);
    });

    return array_values($permittedExtensions);
}

function getExtensions($currentUserGroup)
{

    $extensions = array_values(Bootstrap::get('extensions'));

    // filter out tabs that aren't visible
    if (array_key_exists('nav_blacklist', $currentUserGroup)) {
        $extensions = filterPermittedExtensions($extensions, $currentUserGroup['nav_blacklist']);
    }

    // Append relative path and filename for dynamic loading
    foreach ($extensions as &$extension) {
        $extension = ltrim($extension, '/');
    };

    return $extensions;
}

function getPrivileges($groupId)
{
    global $ZendDb, $acl;
    $tableGateway = new DirectusPrivilegesTableGateway($acl, $ZendDb);

    return $tableGateway->fetchGroupPrivilegesRaw($groupId);
}

function getUI()
{
    return Bootstrap::get('uis');
}

function getListViews()
{
    return Bootstrap::get('listViews');
}

function getCusomFooterHTML()
{
    if (file_exists('./customFooterHTML.html')) {
        return file_get_contents('./customFooterHTML.html');
    }

    return '';
}

function getCSSFilePath()
{
    if (file_exists('./assets/css/custom.css')) {
        return DIRECTUS_PATH . 'assets/css/custom.css';
    }

    return DIRECTUS_PATH . 'assets/css/directus.css';
}

function parseLocalesAvailable($localesAvailable)
{
    return array_map(function ($language) {
        return $language->toArray();
    }, array_values($localesAvailable));
}

// ---------------------------------------------------------------------

/**
 * Optionally force HTTPS
 */

$config = Bootstrap::get('config');
$forceHttps = isset($config['HTTP']) && isset($config['HTTP']['forceHttps'])
    && $config['HTTP']['forceHttps'];
if ($forceHttps) {
    $isHttpsFallbackFn = function () {
        return isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off';
    };
    $isHttpsFn = isset($config['HTTP']['isHttpsFn']) ?
        $config['HTTP']['isHttpsFn'] : $isHttpsFallbackFn;
    if (!$isHttpsFn()) {
        $host = 'https://' . $_SERVER['SERVER_NAME'];
        if ('80' != $_SERVER['SERVER_PORT']) {
            $host .= ':' . $_SERVER['SERVER_PORT'];
        }
        $httpsUrl = $host . $_SERVER['REQUEST_URI'];
        header('Location: ' . $httpsUrl);
        exit;
    }
}

$users = getUsers();
// hotfix
// @NOTE: if the user doesn't have permission to view users
// it should be log out
// see: https://github.com/directus/directus/issues/1268
if (!$users) {
    AuthProvider::logout();
    $_SESSION['error_message'] = 'Your user doesn\'t have permission to log in';
    header('Location: ' . DIRECTUS_PATH . 'login.php');
    exit;
}
$currentUserInfo = getCurrentUserInfo($users);

// Cache buster
$git = __DIR__ . '/.git';
$cacheBuster = Directus\Util\Git::getCloneHash($git);

$tableSchema = TableSchema::getAllSchemas($currentUserInfo['group']['id'], $cacheBuster);

// $tabPrivileges = getTabPrivileges(($currentUserInfo['group']['id']));
$groupId = $currentUserInfo['group']['id'];
$groups = getGroups();
$currentUserGroup = [];
if (isset($groups['rows']) && count($groups['rows'] > 0)) {
    foreach ($groups['rows'] as $group) {
        if ($group['id'] === $groupId) {
            $currentUserGroup = $group;
            break;
        }
    }
}

$statusMapping = [
    'active_num' => STATUS_ACTIVE_NUM,
    'deleted_num' => STATUS_DELETED_NUM,
    'draft_num' => STATUS_DRAFT_NUM,
    'status_name' => STATUS_COLUMN_NAME
];
$statusMapping['mapping'] = $config['statusMapping'];

$data = [
    'cacheBuster' => $cacheBuster,
    'nonces' => getNonces(),
    'storage_adapters' => getStorageAdapters(),
    'path' => DIRECTUS_PATH,
    'page' => '#tables',
    'tables' => parseTables($tableSchema),
    'preferences' => parsePreferences($tableSchema), //ok
    'users' => $users,
    'groups' => $groups,
    'settings' => getSettings(),
    'active_files' => getActiveFiles(),
    'authenticatedUser' => $authenticatedUser,
    // 'tab_privileges' => $tabPrivileges,
    'extensions' => getExtensions($currentUserGroup),
    'privileges' => getPrivileges($groupId),
    'ui' => getUI(),
    'locale' => get_user_locale(),
    'localesAvailable' => parseLocalesAvailable(get_locales_available()),
    'phrases' => get_phrases(get_user_locale()),
    'timezone' => get_user_timezone(),
    'timezones' => get_timezone_list(),
    'listViews' => getListViews(),
    'messages' => getInbox(),
    'user_notifications' => getLoginNotification(),
    'bookmarks' => getBookmarks(),
    'extendedUserColumns' => getExtendedUserColumns($tableSchema),
    'statusMapping' => $statusMapping
];

$templateVars = [
    'cacheBuster' => $cacheBuster,
    'data' => json_encode($data),
    // 'path' => DIRECTUS_PATH,
    'rootUrl' => DIRECTUS_PATH,
    'assetsRoot' => rtrim(DIRECTUS_PATH, '/') . '/assets/',
    'locale' => get_user_locale(),
    'dir' => 'ltr',
    'customFooterHTML' => getCusomFooterHTML(),
    'cssFilePath' => getCSSFilePath()
];

// @TODO: Compile html
$app = Bootstrap::get('app');
$app->render('base.twig.html', $templateVars);
// echo template(file_get_contents('main.html'), $templateVars);
