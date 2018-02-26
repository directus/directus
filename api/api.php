<?php

// Composer Autoloader
$loader = require __DIR__ . '/../vendor/autoload.php';

// Non-autoload components
$configFile = __DIR__ . '/config.php';

// Make sure the config file has something in it
if (!file_exists($configFile) || filesize($configFile) === 0) {
    return create_ping_server();
}

require $configFile;

/**
 * Intercepts /<version>/ping request path
 *
 * To verify the server is working
 * But it's actually to check if mod_rewrite is working :)
 *
 * Only available when it's not in production
 *
 * This is a hotfix to prevent other issues to make it looks like the API is not receiving the request
 * See:
 */
if (!defined('DIRECTUS_ENV') || DIRECTUS_ENV !== 'production') {
    $requestUri = trim(get_request_uri(), '/');
    $parts = explode('/', $requestUri);
    array_shift($parts);
    $requestUri = implode('/', $parts);

    if ($requestUri === 'ping') {
        if (ob_get_level() !== 0) {
            ob_clean();
        }

        echo 'pong';
        exit;
    }
}

// Define directus environment
defined('DIRECTUS_ENV')
|| define('DIRECTUS_ENV', (getenv('DIRECTUS_ENV') ? getenv('DIRECTUS_ENV') : 'production'));

switch (DIRECTUS_ENV) {
    case 'development':
    case 'staging':
        break;
    case 'production':
    default:
        error_reporting(0);
        break;
}

$isHttps = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off';
$url = ($isHttps ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
define('HOST_URL', $url);
define('API_PATH', dirname(__FILE__));
define('BASE_PATH', dirname(API_PATH));

use Directus\Bootstrap;
use Directus\Database\TableGateway\DirectusGroupsTableGateway;
use Directus\Database\TableGateway\DirectusPrivilegesTableGateway;
use Directus\Database\TableGateway\DirectusUsersTableGateway;
use Directus\Exception\ExceptionHandler;
use Directus\Util\ArrayUtils;
use Directus\View\ExceptionView;

/**
 * Slim App & Directus Providers
 */

/** @var \Directus\Application\Application $app */
$app = Bootstrap::get('app');

/**
 * Load Registered Hooks
 */
$config = Bootstrap::get('config');
if ($config->has('hooks')) {
    load_registered_hooks($config->get('hooks'), false);
}

if ($config->get('filters')) {
    // set seconds parameter "true" to add as filters
    load_registered_hooks($config->get('filters'), true);
}

$app->add(new \Directus\Slim\CorsMiddleware());
$app->add(new \Directus\Slim\HttpCacheMiddleware());
$app->add(new \Directus\Slim\ResponseCacheMiddleware());

$app->config('debug', false);
$app->config('production', 'production' === DIRECTUS_ENV);

// Catch all exceptions
$app->error(function ($exception) use ($app) {
    // Force the server status to be 500
    $app->response->status(500);
    $exceptionHandler = new ExceptionHandler($app->hookEmitter);
    $exceptionHandler->handleException($exception);
});

// Routes which do not need protection by the authentication and the request
// @TODO: Move this to a middleware
$authRouteWhitelist = [
    'auth_login',
    'auth_logout',
    'auth_session',
    'auth_clear_session',
    'auth_reset_password',
    'auth_forgot_password',
    'debug_acl_poc',
    'ping_server',
    'request_token',
];

/**
 * Bootstrap Providers
 */

/**
 * @var \Zend\Db\Adapter\AdapterInterface
 */
$ZendDb = Bootstrap::get('ZendDb');

/**
 * @var \Directus\Permissions\Acl
 */
$acl = Bootstrap::get('acl');
$authentication = Bootstrap::get('auth');

$app->hookEmitter->run('application.boot', $app);
$app->hook('slim.before.dispatch', function () use ($app, $authRouteWhitelist, $ZendDb, $acl, $authentication) {
    // API/Server is about to initialize
    $app->hookEmitter->run('application.init', $app);

    // TODO: Move this process to a middleware

    /** Skip routes which don't require these protections */
    $routeName = $app->router()->getCurrentRoute()->getName();
    if (!in_array($routeName, $authRouteWhitelist)) {
        $headers = $app->request()->headers();
        $authToken = false;
        if ($app->request()->get('access_token')) {
            $authToken = $app->request()->get('access_token');
        } elseif ($headers->has('Php-Auth-User')) {
            $authUser = $headers->get('Php-Auth-User');
            $authPassword = $headers->get('Php-Auth-Pw');
            if ($authUser && empty($authPassword)) {
                $authToken = $authUser;
            }
        } elseif ($headers->has('Authorization')) {
            $authorizationHeader = $headers->get('Authorization');
            if (preg_match("/Bearer\s+(.*)$/i", $authorizationHeader, $matches)) {
                $authToken = $matches[1];
            }
        }

        $user = null;
        $isPublicUser = false;
        if ($authToken) {
            // @TODO: Users without group shouldn't be allow to log in
            $DirectusUsersTableGateway = new \Zend\Db\TableGateway\TableGateway('directus_users', $ZendDb);
            $user = $DirectusUsersTableGateway->select(['token' => $authToken, 'status' => 1]);
            $userFound = $user->count() > 0 ? true : false;

            if (!$userFound) {
                $app->halt(401, __t('you_must_be_logged_in_to_access_the_api'));
            }

            $user = $user->toArray();
            $user = reset($user);
        } else if (!$authentication->loggedIn()) {
            $directusGroupsTableGateway = new DirectusGroupsTableGateway($ZendDb, $acl);
            $publicGroup = $directusGroupsTableGateway->select(['name' => 'public'])->current();
            $uri = trim($app->request()->getResourceUri(), '/');
            $uriParts = explode('/', $uri);

            if (ArrayUtils::get($uriParts, 0) === '1.1' && $publicGroup) {
                $isPublicUser = true;

                // NOTE: 0 will not represent a "guest" or the "public" user
                // To prevent the issue where user column on activity table can't be null
                $user = [
                    'id' => 0,
                    'group' => $publicGroup['id']
                ];
            }
        }

        if ($user) {
            // ------------------------------
            // Check if group needs whitelist
            $groupId = $user['group'];
            $directusGroupsTableGateway = new DirectusGroupsTableGateway($ZendDb, $acl);

            if (!$directusGroupsTableGateway->acceptIP($groupId, $app->request->getIp())) {
                $app->response->setStatus(401);
                $app->response([
                    'message' => 'Request not allowed from IP address',
                    'success' => false
                ]);
                return $app->stop();
            }

            // Uf the request it's done by authentication
            // Store the session information in a global variable
            // And we retrieve this information back to session at the end of the execution.
            // See slim.after hook.
            $GLOBALS['__SESSION'] = $_SESSION;
            // Reset SESSION values
            $_SESSION = [];

            $authentication->setLoggedUser($user['id'], true);
            if ($user['id']) {
                $app->hookEmitter->run('directus.authenticated', [$app, $user]);
                $app->hookEmitter->run('directus.authenticated.token', [$app, $user]);
            }

            // Reload all user permissions
            // At this point ACL has run and loaded all permissions
            // This behavior works as expected when you are logged to the CMS/Management
            // When logged through API we need to reload all their permissions
            $privilegesTable = new DirectusPrivilegesTableGateway($ZendDb, $acl);
            $acl->setGroupPrivileges($privilegesTable->getGroupPrivileges($user['group']));
            // TODO: Adding an user should auto set its ID and GROUP
            // TODO: User data should be casted to its data type
            $acl->setUserId($user['id']);
            $acl->setGroupId($user['group']);
            $acl->setPublic($isPublicUser);

            // Set full permission to Admin
            if ($acl->isAdmin()) {
                $acl->setTablePrivileges('*', $acl::PERMISSION_FULL);
            }
        }

        /** Enforce required authentication. */
        if (!$authentication->loggedIn()) {
            $app->halt(401, __t('you_must_be_logged_in_to_access_the_api'));
        }

        // User is authenticated
        // And Directus is about to start
        $app->hookEmitter->run('directus.start', $app);
    }

    $permissions = $app->container->get('acl');
    $permissions->setUserId($acl->getUserId());
    $permissions->setGroupId($acl->getGroupId());
    $permissions->setGroupPrivileges($acl->getGroupPrivileges());
    $app->container->set('auth', Bootstrap::get('auth'));

    \Directus\Database\TableSchema::setAclInstance($permissions);
    \Directus\Database\TableSchema::setConnectionInstance($ZendDb);
    \Directus\Database\TableSchema::setConfig(Bootstrap::get('config'));
    \Directus\Database\TableGateway\BaseTableGateway::setHookEmitter($app->container->get('hookEmitter'));

    $app->container->set('schemaManager', Bootstrap::get('schemaManager'));
});

$app->hook('slim.after', function () use ($app) {
    // retrieve session from global
    // if the session exists on globals it means this is a request with basic authentication
    if (array_key_exists('__SESSION', $GLOBALS)) {
        $_SESSION = $GLOBALS['__SESSION'];
    }

    // API/Server is about to shutdown
    $app->hookEmitter->run('application.shutdown', $app);
});

/**
 * Authentication
 */

$DirectusUsersTableGateway = new DirectusUsersTableGateway($ZendDb, $acl);
$authentication->setUserCacheRefreshProvider(function ($userId) use ($DirectusUsersTableGateway) {
    static $users = [];

    if (isset($users[$userId])) {
        return $users[$userId];
    }

    $cacheFn = function () use ($userId, $DirectusUsersTableGateway) {
        return $DirectusUsersTableGateway->find($userId);
    };

    // $cacheKey = MemcacheProvider::getKeyDirectusUserFind($userId);
    // $user = $DirectusUsersTableGateway->memcache->getOrCache($cacheKey, $cacheFn, 10800);
    $user = $cacheFn();

    $users[$userId] = $user;

    return $user;
});

if ($authentication->loggedIn()) {
    $user = $authentication->getUserRecord();
    $acl->setUserId($user['id']);
    $acl->setGroupId($user['group']);
    $privilegesTable = new DirectusPrivilegesTableGateway($ZendDb, $acl);
    $acl->setGroupPrivileges($privilegesTable->getGroupPrivileges($user['group']));
}

/**
 * Request Payload
 */

$params = $app->request->get();
$requestPayload = $app->request->post();

$endpoints = Bootstrap::getCustomEndpoints();
foreach ($endpoints as $endpoint) {
    require $endpoint;
}

/**
 * Extension Alias
 */
$runExtensions = isset($_REQUEST['run_extension']) && $_REQUEST['run_extension'];
if ($runExtensions) {
    // Validate extension name
    $extensionName = $_REQUEST['run_extension'];
    if (!Bootstrap::extensionExists($extensionName)) {
        throw new \RuntimeException(__t('extension_x_not_found', [
            'name' => $extensionName
        ]));
    }

    $extensionsDirectory = APPLICATION_PATH . '/customs/extensions';
    $extensionEndpointsPath = "$extensionsDirectory/$extensionName/api.php";

    $app->group(sprintf('/extensions/%s/?', $extensionName), function () use ($app, $extensionEndpointsPath) {
        require $extensionEndpointsPath;
    });
}


$app->group('/1.1', function() use($app) {
    // =============================================================================
    // Authentication
    // =============================================================================
    $app->post('/auth/request-token/?', '\Directus\API\Routes\A1\Auth:requestToken')
        ->name('request_token');
    $app->post('/auth/login/?', '\Directus\API\Routes\A1\Auth:login')
        ->name('auth_login');
    $app->get('/auth/logout(/:inactive)', '\Directus\API\Routes\A1\Auth:logout')
        ->name('auth_logout');
    $app->get('/auth/reset-password/:token/?', '\Directus\API\Routes\A1\Auth:resetPassword')
        ->name('auth_reset_password');
    $app->post('/auth/forgot-password/?', '\Directus\API\Routes\A1\Auth:forgotPassword')
        ->name('auth_forgot_password');
    $app->get('/auth/permissions/?', '\Directus\API\Routes\A1\Auth:permissions')
        ->name('auth_permissions');

    // =============================================================================
    // UTILS
    // =============================================================================
    $app->post('/hash/?', '\Directus\API\Routes\A1\Utils:hash')->name('utils_hash');
    $app->post('/random/?', '\Directus\API\Routes\A1\Utils:randomString')->name('utils_random');

    // =============================================================================
    // Privileges
    // =============================================================================
    $app->get('/privileges/:groupId(/:tableName)/?', '\Directus\API\Routes\A1\Privileges:showPrivileges');
    $app->post('/privileges/:groupId/?', '\Directus\API\Routes\A1\Privileges:createPrivileges');
    $app->put('/privileges/:groupId/:privilegeId/?', '\Directus\API\Routes\A1\Privileges:updatePrivileges');

    // =============================================================================
    // ENTRIES COLLECTION
    // =============================================================================
    $app->map('/tables/:table/rows/?', '\Directus\API\Routes\A1\Entries:rows')
        ->via('GET', 'POST', 'PUT');
    // put /bulk first, to prevent /tables/:table/rows/:id be called first.
    $app->map('/tables/:table/rows/bulk/?', '\Directus\API\Routes\A1\Entries:rowsBulk')
        ->via('POST', 'PATCH', 'PUT', 'DELETE');
    $app->map('/tables/:table/rows/:id/?', '\Directus\API\Routes\A1\Entries:row')
        ->via('DELETE', 'GET', 'PUT', 'PATCH');
    $app->get('/tables/:table/meta/:id/?', '\Directus\API\Routes\A1\Entries:meta');
    $app->get('/tables/:table/typeahead/?', '\Directus\API\Routes\A1\Entries:typeAhead');

    // =============================================================================
    // ACTIVITY
    // =============================================================================
    $app->get('/activity/?', '\Directus\API\Routes\A1\Activity:activity');

    // =============================================================================
    // COLUMNS
    // =============================================================================
    // GET all table columns, or POST one new table column
    $app->map('/tables/:table/columns/?', '\Directus\API\Routes\A1\Table:columns')
        ->via('GET', 'POST');
    $app->patch('/tables/:table/columns/bulk/?', '\Directus\API\Routes\A1\Table:columns');
    // GET or PUT one column
    $app->map('/tables/:table/columns/:column/?', '\Directus\API\Routes\A1\Table:column')
        ->via('GET', 'PUT', 'PATCH', 'DELETE');
    $app->post('/tables/:table/columns/:column/?', '\Directus\API\Routes\A1\Table:postColumn');

    // =============================================================================
    // GROUPS
    // =============================================================================
    $app->map('/groups/?', '\Directus\API\Routes\A1\Groups:groups')
        ->via('GET', 'POST');
    $app->get('/groups/:id/?', '\Directus\API\Routes\A1\Groups:group');
    $app->patch('/groups/:id/?', '\Directus\API\Routes\A1\Groups:patchGroup');
    $app->delete('/groups/:id/?', '\Directus\API\Routes\A1\Groups:deleteGroup');

    // =============================================================================
    // FILES
    // =============================================================================
    $app->map('/files(/:id)/?', '\Directus\API\Routes\A1\Files:files')
        ->via('GET', 'PATCH', 'POST', 'PUT', 'DELETE');

    // =============================================================================
    // UPLOAD
    // =============================================================================
    $app->post('/upload/?', '\Directus\API\Routes\A1\Files:upload');
    $app->post('/upload/link/?', '\Directus\API\Routes\A1\Files:uploadLink');

    // =============================================================================
    // PREFERENCES
    // =============================================================================
    $app->map('/tables/:table/preferences/?', '\Directus\API\Routes\A1\Preferences:mapPreferences')
        ->via('GET', 'POST', 'PUT', 'DELETE');

    $app->get('/preferences/:table', '\Directus\API\Routes\A1\Preferences:getPreferences');

    // =============================================================================
    // BOOKMARKS
    // =============================================================================
    $app->get('/bookmarks/:id/preferences', '\Directus\API\Routes\A1\Bookmarks:preferences');
    $app->get('/bookmarks/self/?', '\Directus\API\Routes\A1\Bookmarks:selfBookmarks');
    $app->get('/bookmarks/user/:id?', '\Directus\API\Routes\A1\Bookmarks:userBookmarks');
    $app->get('/bookmarks/?', '\Directus\API\Routes\A1\Bookmarks:allBookmarks');
    $app->map('/bookmarks(/:id)/?', '\Directus\API\Routes\A1\Bookmarks:bookmarks')
        ->via('POST', 'PUT', 'DELETE');

    // =============================================================================
    // REVISIONS
    // =============================================================================
    $app->get('/tables/:table/rows/:id/revisions/?', '\Directus\API\Routes\A1\Revisions:revisions');

    // =============================================================================
    // SETTINGS
    // =============================================================================
    $app->map('/settings(/:id)/?', '\Directus\API\Routes\A1\Settings:settings')
        ->via('GET', 'PATCH', 'POST', 'PUT');

    // =============================================================================
    // TABLES
    // =============================================================================
    $app->get('/tables/?', '\Directus\API\Routes\A1\Table:names');
    $app->post('/tables/?', '\Directus\API\Routes\A1\Table:create')
        ->name('table_create');
    // GET and PUT table details
    $app->map('/tables/:table/?', '\Directus\API\Routes\A1\Table:info')
        ->via('GET', 'PATCH', 'PUT', 'DELETE')
        ->name('table_meta');
    $app->delete('/tables/:table/unmanage/?', '\Directus\API\Routes\A1\Table:unmanage');

    // =============================================================================
    // COLUMN UI
    // =============================================================================
    $app->map('/tables/:table/columns/:column/:ui/?', '\Directus\API\Routes\A1\Table:columnUi')
        ->via('GET', 'POST', 'PUT');

    // =============================================================================
    // MESSAGES
    // =============================================================================
    $app->get('/messages/rows/?', '\Directus\API\Routes\A1\Messages:rows');
    $app->delete('/messages/rows/bulk?', '\Directus\API\Routes\A1\Messages:archiveMessages');
    $app->get('/messages/user/:id/?', '\Directus\API\Routes\A1\Messages:rows');
    $app->get('/messages/self/?', '\Directus\API\Routes\A1\Messages:rows');
    $app->get('/messages/rows/:id/?', '\Directus\API\Routes\A1\Messages:row');
    // @TODO: this will perform an actual "get message by id"
    // $app->get('/messages/:id/?', '\Directus\API\Routes\A1\Messages:row');
    $app->map('/messages/rows/:id/?', '\Directus\API\Routes\A1\Messages:patchRow')
        ->via('PATCH');
    // add response using this endpoint
    $app->put('/messages/rows/:id/?', '\Directus\API\Routes\A1\Messages:postRows');
    $app->post('/messages/rows/?', '\Directus\API\Routes\A1\Messages:postRows');
    $app->get('/messages/recipients/?', '\Directus\API\Routes\A1\Messages:recipients');
    $app->post('/comments/?', '\Directus\API\Routes\A1\Messages:comments');

    // =============================================================================
    // USERS
    // =============================================================================
    \Slim\Route::setDefaultConditions([
        'userId' => '([0-9]+|me)'
    ]);

    $app->get('/users/?', '\Directus\API\Routes\A1\Users:get');
    $app->get('/users/:userId/?', '\Directus\API\Routes\A1\Users:get');
    $app->post('/users/invite/?', '\Directus\API\Routes\A1\Users:invite');
    $app->map('/users/:userId/?', '\Directus\API\Routes\A1\Users:update')
        ->via('DELETE', 'PUT', 'PATCH');
    $app->post('/users/?', '\Directus\API\Routes\A1\Users:update');

    // =============================================================================
    // USERS TRACKING
    // =============================================================================
    $app->post('/users/tracking/page', '\Directus\API\Routes\A1\Tracking:page');

    // =============================================================================
    // DEBUG
    // =============================================================================
    if ('production' !== DIRECTUS_ENV) {
        $app->get('/auth/session/?', '\Directus\API\Routes\A1\Auth:session')
            ->name('auth_session');
        $app->get('/auth/clear-session/?', '\Directus\API\Routes\A1\Auth:clearSession')
            ->name('auth_clear_session');
    }
});

$app->notFound(function () use ($app, $acl, $ZendDb) {
    $projectInfo = get_project_info();

    $app->response()->header('Content-Type', 'text/html; charset=utf-8');
    $app->render('errors/404.twig', $projectInfo);
});

/**
 * Run the Router
 */

if ($runExtensions || (isset($_GET['run_api_router']) && $_GET['run_api_router'])) {
    // Run Slim
    $app->response()->header('Content-Type', 'application/json; charset=utf-8');
    $app->run();
}
