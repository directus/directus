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

use Directus\Util\ArrayUtils;
use Directus\Bootstrap;
use Directus\Database\TableGateway\DirectusBookmarksTableGateway;
use Directus\Database\TableGateway\DirectusMessagesTableGateway;
use Directus\Database\TableGateway\DirectusPrivilegesTableGateway;
use Directus\Database\TableGateway\DirectusSettingsTableGateway;
use Directus\Database\TableGateway\DirectusUsersTableGateway;
use Directus\Database\TableGateway\RelationalTableGateway as TableGateway;
use Directus\Database\TableSchema;

// @TODO: Wrap all this into a routing "app"
$app = Bootstrap::get('app');

$app->onMissingRequirements(function (array $errors) use ($app) {
    display_missing_requirements_html($errors, $app);
});

// do not call the api hooks
$app->clearHooks();

// hotfix: while this page still not part of the routing
// Not found means, you have to continue with the this file statements
$redirectToLogin = function () use ($app) {
    $request_uri = $app->request()->getResourceUri();

    if (strpos($request_uri, get_directus_path()) === 0) {
        $request_uri = substr($request_uri, strlen(get_directus_path()));
    }

    $redirect = htmlspecialchars(trim($request_uri, '/'), ENT_QUOTES, 'UTF-8');
    if ($redirect) {
        $_SESSION['_directus_login_redirect'] = $redirect;
        $redirect = '?redirect=' . $redirect;
    }

    header('Location: ' . get_directus_path('/login.php' . $redirect));
    exit;
    // $app->response()->redirect(DIRECTUS_PATH . 'login.php' . $redirect);
};

$authentication = Bootstrap::get('auth');

$emitter = Bootstrap::get('hookEmitter');
$emitter->run('directus.index.start');

$app->group('/auth', function() use ($app) {
    $app->get('/:name', function($name) use ($app) {
        $socialAuth = $app->container->get('socialAuth');
        try {
            $socialAuth->get($name)->request();
        } catch (\Exception $e) {
            $session = $app->container->get('session');
            // @TODO: Implement/use a set flash
            $session->set('error_message', $e->getMessage());
            header('Location: /');
        }
        exit;
    });
    $app->get('/:name/receive', function($name) use ($app) {
        $socialAuth = $app->container->get('socialAuth');
        $authService = $app->container->get('authService');

        try {
            $user = $socialAuth->get($name)->handle();
            if ($user instanceof \League\OAuth1\Client\Server\User) {
                $email = $user->email;
            } else {
                $email = $user->getEmail();
            }

            $authService->authenticateUserWithEmail($email);

            // $app->response()->redirect($directusPath . ' /tables');
            header('Location: ' . get_directus_path('/tables'));
            exit;
        } catch (\Exception $e) {
            $log = Bootstrap::get('log');
            $log->error($e);

            $session = $app->container->get('session');
            // @TODO: Implement/use a set flash
            $session->set('error_message', $e->getMessage());
            // $app->response()->redirect('/');
            header('Location: /');
            exit;
        }
    });
});

// Only run the routing when requesting anything by root
if (!$authentication->loggedIn() && $app->request()->getResourceUri() !== get_directus_path() . '/') {
    $app->notFound($redirectToLogin);
    $app->run();
}

// No access, forward to login page
unset($_SESSION['_directus_login_redirect']);
$showWelcomeWindow = false;
if (!$authentication->loggedIn()) {
    $invitationCode = $app->request()->get('invitation_code');
    $authenticated = false;

    if ($invitationCode) {
        $authenticated = $authentication->authenticateWithInvitation($invitationCode);
    }

    if ($authenticated) {
        $session->set('on_invitation', true);
        $showWelcomeWindow = true;
        $invitationUser = $authentication->getUserRecord();

        $privilegesTable = new DirectusPrivilegesTableGateway($ZendDb, $acl);
        $privileges = $privilegesTable->getGroupPrivileges($invitationUser['group']);
        $acl->setGroupPrivileges($privileges);
        // @TODO: Adding an user should auto set its ID and GROUP
        $acl->setUserId($invitationUser['id']);
        $acl->setGroupId($invitationUser['group']);
    } else {
        $redirectToLogin();
        exit;
    }
}

if (!$showWelcomeWindow) {
    $authenticatedUser = $authentication->getUserRecord();
    if ($authenticatedUser['invite_accepted'] === 0) {
        $showWelcomeWindow = true;
    }
}

$acl = Bootstrap::get('acl');
$ZendDb = Bootstrap::get('ZendDb');
$authenticatedUser = $authentication->loggedIn() ? $authentication->getUserInfo() : [];

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

        // Remove preferences
        unset($table['preferences']);

        // Skip directus tables
        if ('directus_' === substr($tableName, 0, 9) && 'directus_messages_recipients' !== $tableName) {
            continue;
        }

        $tables[] = $table;
    }

    return $tables;
}

function getExtendedUserColumns($tableSchema)
{
    $userColumns = ['activity', 'avatar', 'name', 'id', 'status', 'first_name', 'last_name', 'email', 'email_messages', 'password', 'salt', 'token', 'reset_token', 'reset_expiration', 'last_login', 'last_page', 'ip', 'group'];

    $schema = array_filter($tableSchema, function ($table) {
        return $table['schema']['id'] === 'directus_users';
    });

    $schema = reset($schema);

    $columns = array_filter($schema['schema']['columns'], function ($column) use ($userColumns) {
        return !in_array($column['id'], $userColumns);
    });

    return array_values($columns);

}

function getExtendedFilesColumns($tableSchema)
{
    // TODO: Create an object that stores all system tables columns
    $filesColumns = [
        'id',
        'status',
        'name',
        'title',
        'location',
        'caption',
        'type',
        'charset',
        'tags',
        'width',
        'height',
        'size',
        'embed_id',
        'user',
        'date_uploaded',
        'storage_adapter'
    ];

    $schema = array_filter($tableSchema, function ($table) {
        return $table['schema']['id'] === 'directus_files';
    });

    $schema = reset($schema);

    $columns = array_filter($schema['schema']['columns'], function ($column) use ($filesColumns) {
        return !in_array($column['id'], $filesColumns);
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

    $aclParam = $acl;
    $params = [
        'table_name' => 'directus_users',
        'perPage' => 1000,
        'depth' => 1,
        'columns' => TableSchema::getAllTableColumnsName('directus_users')
        // 'columns_visible' => ['id', STATUS_COLUMN_NAME, 'avatar', 'first_name', 'last_name', 'group', 'email', 'position', 'last_access']
    ];

    if (!$acl->canView('directus_users')) {
        $aclParam = null;
        $params['filters'] = [
            'id' => ['in' => $acl->getUserId()]
        ];
    }

    $tableGateway = new TableGateway('directus_users', $ZendDb, $aclParam);
    $users = $tableGateway->getEntries($params);

    // Lets get the gravatar if no avatar is set.
    // TODO: Add this on insert/update of any user.
    $usersRowsToUpdate = [];
    foreach ($users['data'] as $user) {
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
    $data = array_filter($users['data'], function ($item) use ($authenticatedUser) {
        return ($item['id'] == $authenticatedUser['id']);
    });

    return reset($data);
}

function getBookmarks()
{
    global $ZendDb, $authenticatedUser;

    $bookmarks = new DirectusBookmarksTableGateway($ZendDb, null);

    return $bookmarks->fetchAllByUser($authenticatedUser['id']);
}

function getGroups()
{
    global $ZendDb, $acl;

    $aclParam = $acl;
    $params = ['depth' => 1];

    if (!$acl->canView('directus_groups')) {
        $aclParam = null;
        $params['filters'] = [
            'id' => ['in' => $acl->getGroupId()]
        ];
    }

    $groups = new TableGateway('directus_groups', $ZendDb, $aclParam);
    // @todo: move to DirectusGroupsTableGateway
    $groupEntries = $groups->getEntries($params);

    $groupEntries['data'] = array_map(function ($row) {
        $navOverride = ArrayUtils::get($row, 'nav_override');
        ArrayUtils::set($row, 'nav_override', null);

        $navOverride = @json_decode($navOverride);
        if (json_last_error() !== JSON_ERROR_NONE || !$navOverride) {
            return $row;
        }

        $row['nav_override'] = [];
        foreach ($navOverride as $category => $items) {
            foreach ($items as $title => $path) {
                $key = implode('.', ['nav_override', $category, $title]);
                ArrayUtils::set($row, $key, [
                    'path' => $path
                ]);
            }
        }

        return $row;
    }, $groupEntries['data']);

    return $groupEntries;
}

function getSettings()
{
    global $ZendDb;

    $settingsTable = new DirectusSettingsTableGateway($ZendDb, null);

    $settings = $settingsTable->getItems(['limit' => null]);

    foreach ($settings['data'] as &$setting) {
        if ($setting['name'] === 'cms_thumbnail_url' && isset($setting['value'])) {
            $filesTableGateway = new TableGateway('directus_files', $ZendDb, null);
            $setting['value'] = $filesTableGateway->loadItems(['id' => $setting['value']]);
            break;
        }
    }

    array_push($settings['data'], [
        'id' => 'max_file_size',
        'name' => 'max_file_size',
        'collection' => 'global',
        'value' => get_max_upload_size()
    ]);

    return $settings;
}

function getConfig($settings)
{
    $keys = ['rows_per_page'];
    $configs = [];
    foreach($settings['data'] as $setting) {
        if (in_array($setting['name'], $keys)) {
            $configs[$setting['name']] = $setting['value'];
        }
    }

    return $configs;
}

function getInbox()
{
    global $ZendDb, $acl, $authenticatedUser;

    $messages = [];

    if ($acl->canView('directus_messages') && $acl->canView('directus_messages_recipients')) {
        $tableGateway = new DirectusMessagesTableGateway($ZendDb, $acl);

        $messages = $tableGateway->fetchMessagesInboxWithHeaders($authenticatedUser['id']);
    }

    return $messages;
}

/**
 * Get new version notification
 *
 * @return null|array
 */
function getVersionNotification()
{
    $app = \Directus\Application\Application::getInstance();

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
                'installed_version' => $app->getVersion(),
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
    global $ZendDb;

    $tableGateway = new DirectusPrivilegesTableGateway($ZendDb, null);

    return $tableGateway->fetchGroupPrivilegesRaw($groupId);
}

function getInterfaces()
{
    return Bootstrap::get('interfaces');
}

function getDefaultInterfaces()
{
    $schema = Bootstrap::get('schemaManager');

    return $schema->getDefaultInterfaces();
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
        return get_directus_path('/assets/css/custom.css');
    }

    return get_directus_path('/assets/css/directus.css');
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

/** @var \Directus\Config\Config $config */
$config = Bootstrap::get('config');
$forceHttps = $config->get('http.force_https', false);
if ($forceHttps) {
    $isHttpsFallbackFn = function () {
        return isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off';
    };
    $isHttpsFn = $config->get('isHttpsFn', $isHttpsFallbackFn);
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
    $authentication->logout();
    $_SESSION['error_message'] = 'Your user doesn\'t have permission to log in';
    header('Location: ' . get_directus_path('/login.php'));
    exit;
}
$currentUserInfo = getCurrentUserInfo($users);

// hide welcome modal when the group has not permission to edit user information
if ($showWelcomeWindow === true && !$acl->canEdit('directus_users')) {
    $showWelcomeWindow = false;
}

// Cache buster
$git = __DIR__ . '/.git';
$cacheBuster = Directus\Util\Git::getCloneHash($git);

$tableSchema = TableSchema::getAllSchemas($currentUserInfo['group']['data']['id'], $cacheBuster);

$groupId = $currentUserInfo['group']['data']['id'];
$groups = getGroups();
$currentUserGroup = [];
if (isset($groups['data']) && count($groups['data']) > 0) {
    foreach ($groups['data'] as $group) {
        if ($group['id'] === $groupId) {
            $currentUserGroup = $group;
            break;
        }
    }
}

$allTables = parseTables($tableSchema);

$mapping = [];
foreach ($config['statusMapping'] as $key => $status) {
    $status['id'] = $key;

    $mapping[] = $status;
}

$statusMappingConfiguration = [
    'mapping' => $mapping,
    'status_name' => STATUS_COLUMN_NAME,
    'default_value' => STATUS_DRAFT_NUM,
    'delete_value' => STATUS_DELETED_NUM
];


$statusMapping = [
    '*' => $statusMappingConfiguration
];

$statusMapping['directus_users'] = array_replace_recursive($statusMappingConfiguration, [
    'mapping' => [
        1 => ['name' => __t('Active')],
        2 => ['name' => __t('Inactive')]
    ]
]);

foreach ($allTables as $table) {
    $tableName = \Directus\Util\ArrayUtils::get($table, 'schema.id');
    $tableObject = TableSchema::getTableSchema($tableName);

    /** @var \Directus\Database\Object\Column $statusColumn */
    $statusColumn = $tableObject->getStatusColumn();
    if (!$statusColumn) {
        continue;
    }

    $statusColumn = $tableObject->getColumn($statusColumn);
    $mapping = \Directus\Util\ArrayUtils::get($statusColumn->getOptions(), 'status_mapping');
    if ($mapping && ($mapping = json_decode($mapping, true))) {
        // Add the status index as 'id' if it doesn't exists
        foreach ($mapping as $key => &$item) {
            if (!array_key_exists('id', $item)) {
                $item['id'] = $key;
            }
        }

        $deleteValue = \Directus\Util\ArrayUtils::get($statusColumn->getOptions(), 'delete_value');
        if ($deleteValue === null) {
            $deleteValue = STATUS_DELETED_NUM;
        }

        $statusMapping[\Directus\Util\ArrayUtils::get($table, 'schema.table_name')] = [
            'mapping' => $mapping,
            'status_name' => STATUS_COLUMN_NAME,
            'default_value' => STATUS_DRAFT_NUM,
            'delete_value' => $deleteValue
        ];
    }
}

$settings = getSettings();
$configuration = getConfig($settings);

$data = [
    'cacheBuster' => $cacheBuster,
    'storage_adapters' => getStorageAdapters(),
    'path' => get_directus_path(),
    'page' => '#tables',
    'tables' => $allTables,
    'preferences' => parsePreferences($tableSchema), //ok
    'users' => $users,
    'user' => ['data' => $currentUserInfo],
    'groups' => $groups,
    'settings' => $settings,
    'config' => $configuration,
    'http' => $config->get('http', []),
    'cors' => $config->get('cors', []),
    'authenticatedUser' => $authenticatedUser,
    'extensions' => getExtensions($currentUserGroup),
    'privileges' => getPrivileges($groupId),
    'interfaces' => getInterfaces(),
    'default_interfaces' => getDefaultInterfaces(),
    'locale' => get_user_locale(),
    'localesAvailable' => parseLocalesAvailable(get_locales_available()),
    'phrases' => get_phrases(get_user_locale()),
    'timezone' => get_user_timezone(),
    'timezones' => get_timezone_list(),
    'countries' => get_country_list(),
    'listViews' => getListViews(),
    'messages' => getInbox(),
    'user_notifications' => getLoginNotification(),
    'bookmarks' => getBookmarks(),
    'extendedUserColumns' => getExtendedUserColumns($tableSchema),
    'extendedFilesColumns' => getExtendedFilesColumns($tableSchema),
    'showWelcomeWindow' => $showWelcomeWindow,
    'statusMapping' => $statusMapping
];

$templateVars = [
    'cacheBuster' => $cacheBuster,
    'isAuthenticated' => $authentication->loggedIn() === true,
    'data' => json_encode($data),
    'rootUrl' => get_directus_path(),
    'assetsRoot' => get_directus_path('/assets/'),
    'locale' => get_user_locale(),
    'dir' => 'ltr',
    'customFooterHTML' => getCusomFooterHTML(),
    'cssFilePath' => getCSSFilePath()
];

// TODO: Compile html
$app->render('base.twig', $templateVars);
