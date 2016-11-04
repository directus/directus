<?php

// Composer Autoloader
$loader = require __DIR__ . '/../vendor/autoload.php';

// Non-autoload components
$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    return create_ping_server();
}

require $configFile;

// Define directus environment
defined('DIRECTUS_ENV')
|| define('DIRECTUS_ENV', (getenv('DIRECTUS_ENV') ? getenv('DIRECTUS_ENV') : 'production'));

switch (DIRECTUS_ENV) {
    case 'development_enforce_nonce':
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

use Directus\Acl\Exception\UnauthorizedTableAlterException;
use Directus\Auth\Provider as Auth;
use Directus\Auth\RequestNonceProvider;
use Directus\Bootstrap;
use Directus\Database\SchemaManager;
use Directus\Database\TableGateway\DirectusActivityTableGateway;
use Directus\Database\TableGateway\DirectusBookmarksTableGateway;
use Directus\Database\TableGateway\DirectusGroupsTableGateway;
use Directus\Database\TableGateway\DirectusMessagesRecipientsTableGateway;
use Directus\Database\TableGateway\DirectusMessagesTableGateway;
use Directus\Database\TableGateway\DirectusPreferencesTableGateway;
use Directus\Database\TableGateway\DirectusPrivilegesTableGateway;
use Directus\Database\TableGateway\DirectusSettingsTableGateway;
use Directus\Database\TableGateway\DirectusUiTableGateway;
use Directus\Database\TableGateway\DirectusUsersTableGateway;
use Directus\Database\TableGateway\RelationalTableGateway as TableGateway;
use Directus\Database\TableSchema;
use Directus\Exception\ExceptionHandler;
use Directus\Mail\Mail;
use Directus\MemcacheProvider;
use Directus\Util\ArrayUtils;
use Directus\Util\DateUtils;
use Directus\Util\SchemaUtils;
use Directus\Util\StringUtils;
use Directus\View\ExceptionView;
use Directus\View\JsonView;

// use Directus\Files;
// use Directus\Files\Upload;
// use Directus\Database\TableGateway\DirectusIPWhitelist;

// API Version shortcut for routes:
$v = API_VERSION;

/**
 * Slim App & Directus Providers
 */

$app = Bootstrap::get('app');
$requestNonceProvider = new RequestNonceProvider(Bootstrap::get('session'));

/**
 * Load Registered Hooks
 */
$config = Bootstrap::get('config');
if (array_key_exists('hooks', $config)) {
    load_registered_hooks($config['hooks'], false);
}

if (array_key_exists('filters', $config)) {
    // set seconds parameter "true" to add as filters
    load_registered_hooks($config['filters'], true);
}

/**
 * Catch user-related exceptions & produce client responses.
 */

$app->config('debug', false);
$exceptionView = new ExceptionView();
$exceptionHandler = function (\Exception $exception) use ($app, $exceptionView) {
    $app->emitter->run('application.error', [$exception]);
    $exceptionView->exceptionHandler($app, $exception);
};
$app->error($exceptionHandler);
// // Catch runtime erros etc. as well
// set_exception_handler($exceptionHandler);
$exceptionHandler = new ExceptionHandler;

// Routes which do not need protection by the authentication and the request
// nonce enforcement.
// @TODO: Move this to a middleware
$authAndNonceRouteWhitelist = [
    'auth_login',
    'auth_logout',
    'auth_session',
    'auth_clear_session',
    'auth_nonces',
    'auth_reset_password',
    'auth_permissions',
    'debug_acl_poc',
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
 * @var \Directus\Acl\Acl
 */
$acl = Bootstrap::get('acl');
$authentication = Bootstrap::get('auth');

$app->emitter->run('application.boot', $app);

/**
 * Creates and /<version>/ping endpoint
 */
create_ping_route($app);

$app->hook('slim.before.dispatch', function () use ($app, $requestNonceProvider, $authAndNonceRouteWhitelist, $ZendDb, $acl, $authentication) {
    // API/Server is about to initialize
    $app->emitter->run('application.init', $app);

    /** Skip routes which don't require these protections */
    $routeName = $app->router()->getCurrentRoute()->getName();
    if (!in_array($routeName, $authAndNonceRouteWhitelist)) {
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

        if ($authToken) {
            $DirectusUsersTableGateway = new \Zend\Db\TableGateway\TableGateway('directus_users', $ZendDb);
            $user = $DirectusUsersTableGateway->select(['token' => $authToken]);
            $userFound = $user->count() > 0 ? true : false;

            if (!$userFound) {
                $app->halt(401, __t('you_must_be_logged_in_to_access_the_api'));
            }

            $user = $user->toArray();
            $user = reset($user);

            // ------------------------------
            // Check if group needs whitelist
            $groupId = $user['group'];
            $directusGroupsTableGateway = new DirectusGroupsTableGateway($ZendDb, $acl);
            if (!$directusGroupsTableGateway->acceptIP($groupId, $app->request->getIp())) {
                $app->contentType('application/javascript');
                $app->response->setStatus(401);
                JsonView::render([
                    'message' => 'Request not allowed from IP address',
                    'success' => false
                ]);
                $app->stop();
            }

            // Uf the request it's done by authentication
            // Store the session information in a global variable
            // And we retrieve this information back to session at the end of the execution.
            // See slim.after hook.
            $GLOBALS['__SESSION'] = $_SESSION;
            // Reset SESSION values
            $_SESSION = [];

            $authentication->setLoggedUser($user['id']);
            $app->emitter->run('directus.authenticated', [$app, $user]);
            $app->emitter->run('directus.authenticated.token', [$app, $user]);

            // Reload all user permissions
            // At this point ACL has run and loaded all permissions
            // This behavior works as expected when you are logged to the CMS/Management
            // When logged through API we need to reload all their permissions
            $privilegesTable = new DirectusPrivilegesTableGateway($ZendDb, $acl);
            $acl->setGroupPrivileges($privilegesTable->getGroupPrivileges($user['group']));
            // @TODO: Adding an user should auto set its ID and GROUP
            $acl->setUserId($user['id']);
            $acl->setGroupId($user['group']);
        }

        /** Enforce required authentication. */
        if (!$authentication->loggedIn()) {
            $app->halt(401, __t('you_must_be_logged_in_to_access_the_api'));
        }

        /** Enforce required request nonces. */
        // NOTE: do no use nonce until it's well implemented
        // OR in fact if it's actually necessary.
        // nonce needs to be checked
        // otherwise an error is thrown
        if (!$requestNonceProvider->requestHasValidNonce() && !$authToken) {
            //     if('development' !== DIRECTUS_ENV) {
            //         $app->halt(401, __t('invalid_request_nonce'));
            //     }
        }

        // User is authenticated
        // And Directus is about to start
        $app->emitter->run('directus.start', $app);

        /** Include new request nonces in the response headers */
        $response = $app->response();
        $newNonces = $requestNonceProvider->getNewNoncesThisRequest();
        $nonce_options = $requestNonceProvider->getOptions();
        $response[$nonce_options['nonce_response_header']] = implode($newNonces, ',');
    }
});

$app->hook('slim.after', function () use ($app) {
    // retrieve session from global
    // if the session exists on globals it means this is a request with basic authentication
    if (array_key_exists('__SESSION', $GLOBALS)) {
        $_SESSION = $GLOBALS['__SESSION'];
    }

    // API/Server is about to shutdown
    $app->emitter->run('application.shutdown', $app);
});

/**
 * Authentication
 */

$DirectusUsersTableGateway = new DirectusUsersTableGateway($ZendDb, $acl);
$authentication->setUserCacheRefreshProvider(function ($userId) use ($DirectusUsersTableGateway) {
    $cacheFn = function () use ($userId, $DirectusUsersTableGateway) {
        return $DirectusUsersTableGateway->find($userId);
    };

    $cacheKey = MemcacheProvider::getKeyDirectusUserFind($userId);
    // $user = $DirectusUsersTableGateway->memcache->getOrCache($cacheKey, $cacheFn, 10800);
    $user = $cacheFn();
    return $user;
});

if ($authentication->loggedIn()) {
    $user = $authentication->getUserRecord();
    $acl->setUserId($user['id']);
    $acl->setGroupId($user['group']);
}

/**
 * Request Payload
 */

$params = $_GET;
$requestPayload = json_decode($app->request()->getBody(), true);

$endpoints = Bootstrap::getCustomEndpoints();
foreach ($endpoints as $endpoint) {
    require $endpoint;
}

/**
 * Extension Alias
 */
if (isset($_REQUEST['run_extension']) && $_REQUEST['run_extension']) {
    // Validate extension name
    $extensionName = $_REQUEST['run_extension'];
    if (!Bootstrap::extensionExists($extensionName)) {
        header('HTTP/1.0 404 Not Found');
        return JsonView::render(['message' => __t('no_such_extensions')]);
    }
    // Validate request nonce
    // NOTE: do no use nonce until it's well implemented
    // OR in fact if it's actually necessary.
    // nonce needs to be checked
    // otherwise an error is thrown
    if (!$requestNonceProvider->requestHasValidNonce()) {
        //     if('development' !== DIRECTUS_ENV) {
        //         header("HTTP/1.0 401 Unauthorized");
        //         return JsonView::render(array('message' => __t('unauthorized_nonce')));
        //     }
    }
    $extensionsDirectory = APPLICATION_PATH . '/customs/extensions';
    $responseData = require "$extensionsDirectory/$extensionName/api.php";
    $nonceOptions = $requestNonceProvider->getOptions();
    $newNonces = $requestNonceProvider->getNewNoncesThisRequest();
    header($nonceOptions['nonce_response_header'] . ': ' . implode($newNonces, ','));
    if (!is_array($responseData)) {
        throw new \RuntimeException(__t('extension_x_must_return_array_got_y_instead', [
            'extension_name' => $extensionName,
            'type' => gettype($responseData)
        ]));
    }
    return JsonView::render($responseData);
}

/**
 * Slim Routes
 * (Collections arranged alphabetically)
 */

$app->post("/$v/auth/request-token/?", function() use ($app, $ZendDb) {
    $response = [
        'success' => false,
        'message' => __t('incorrect_email_or_password'),
    ];

    $request = $app->request();
    // @NOTE: Slim request do not parse a json request body
    //        We need to parse it ourselves
    if ($request->getMediaType() == 'application/json') {
        $jsonRequest = json_decode($request->getBody(), true);
        $email = ArrayUtils::get($jsonRequest, 'email', false);
        $password = ArrayUtils::get($jsonRequest, 'password', false);
    } else {
        $email = $request->post('email');
        $password = $request->post('password');
    }

    if ($email && $password) {
        $user = Auth::getUserByAuthentication($email, $password);

        if ($user) {
            unset($response['message']);
            $response['success'] = true;
            $response['data'] = [
                'token' => $user['token']
            ];
        }
    }

    return JsonView::render($response);
})->name('request_token');

$app->post("/$v/auth/login/?", function () use ($app, $ZendDb, $acl, $requestNonceProvider, $authentication) {

    $response = [
        'message' => __t('incorrect_email_or_password'),
        'success' => false,
        'all_nonces' => $requestNonceProvider->getAllNonces()
    ];

    if ($authentication->loggedIn()) {
        $response['success'] = true;
        return JsonView::render($response);
    }

    $req = $app->request();
    $email = $req->post('email');
    $password = $req->post('password');
    $Users = new DirectusUsersTableGateway($ZendDb, $acl);
    $user = $Users->findOneBy('email', $email);

    if (!$user) {
        return JsonView::render($response);
    }

    // ------------------------------
    // Check if group needs whitelist
    $groupId = $user['group'];
    $directusGroupsTableGateway = new DirectusGroupsTableGateway($ZendDb, $acl);
    if (!$directusGroupsTableGateway->acceptIP($groupId, $app->request->getIp())) {
        return JsonView::render([
            'message' => 'Request not allowed from IP address',
            'success' => false,
            'all_nonces' => $requestNonceProvider->getAllNonces()
        ]);
    }

    // =============================================================================
    // Fetch information about the latest version to the admin
    // when they first log in.
    // =============================================================================
    if (is_null($user['last_login']) && $user['group'] == 1) {
        $_SESSION['first_version_check'] = true;
    }

    // @todo: Login should fail on correct information when user is not active.
    $response['success'] = $authentication->login($user['id'], $user['password'], $user['salt'], $password);

    // When the credentials are correct but the user is Inactive
    $userHasStatusColumn = array_key_exists(STATUS_COLUMN_NAME, $user);
    $isUserActive = false;
    if ($userHasStatusColumn && $user[STATUS_COLUMN_NAME] == STATUS_ACTIVE_NUM) {
        $isUserActive = true;
    }

    if ($response['success'] && !$isUserActive) {
        $authentication->logout();
        $response['success'] = false;
        $response['message'] = __t('login_error_user_is_not_active');
        return JsonView::render($response);
    }

    if ($response['success']) {
        // Set logged user to the ACL
        $acl->setUserId($user['id']);
        $acl->setGroupId($user['group']);

        $app->emitter->run('directus.authenticated', [$app, $user]);
        $app->emitter->run('directus.authenticated.admin', [$app, $user]);
        unset($response['message']);
        $response['last_page'] = json_decode($user['last_page']);
        $userSession = $authentication->getUserInfo();
        $set = ['last_login' => DateUtils::now(), 'access_token' => $userSession['access_token']];
        $where = ['id' => $user['id']];
        $updateResult = $Users->update($set, $where);

        $Activity = new DirectusActivityTableGateway($ZendDb, $acl);
        $Activity->recordLogin($user['id']);
    }
    JsonView::render($response);
})->name('auth_login');

$app->get("/$v/auth/logout(/:inactive)", function ($inactive = null) use ($app, $authentication) {
    if ($authentication->loggedIn()) {
        $authentication->logout();
    }
    if ($inactive) {
        $app->redirect(DIRECTUS_PATH . 'login.php?inactive=1');
    } else {
        $app->redirect(DIRECTUS_PATH . 'login.php');
    }
})->name('auth_logout');

$app->get("/$v/auth/nonces/?", function () use ($app, $requestNonceProvider) {
    $all_nonces = $requestNonceProvider->getAllNonces();
    $response = ['nonces' => $all_nonces];
    JsonView::render($response);
})->name('auth_nonces');

// debug helper
$app->get("/$v/auth/session/?", function () use ($app) {
    if ('production' === DIRECTUS_ENV) {
        return $app->halt('404');
    }
    JsonView::render($_SESSION);
})->name('auth_session');

// debug helper
$app->get("/$v/auth/clear-session/?", function () use ($app) {
    if ('production' === DIRECTUS_ENV) {
        return $app->halt('404');
    }

    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params['path'], $params['domain'],
            $params['secure'], $params['httponly']
        );
    }
    session_destroy();
    JsonView::render($_SESSION);
})->name('auth_clear_session');

// debug helper
$app->get("/$v/auth/reset-password/:token/?", function ($token) use ($app, $acl, $ZendDb) {
    $DirectusUsersTableGateway = new DirectusUsersTableGateway($ZendDb, $acl);
    $user = $DirectusUsersTableGateway->findOneBy('reset_token', $token);

    if (!$user) {
        $app->halt(200, __t('password_reset_incorrect_token'));
    }

    $expirationDate = new DateTime($user['reset_expiration'], new DateTimeZone('UTC'));
    if (DateUtils::hasPassed($expirationDate)) {
        $app->halt(200, __t('password_reset_expired_token'));
    }

    $password = StringUtils::randomString();
    $set = [];
    // @NOTE: this is not being used for hashing the password anymore
    $set['salt'] = StringUtils::randomString();
    $set['password'] = Auth::hashPassword($password, $set['salt']);
    $set['reset_token'] = '';

    // Skip ACL
    $DirectusUsersTableGateway = new \Zend\Db\TableGateway\TableGateway('directus_users', $ZendDb);
    $affectedRows = $DirectusUsersTableGateway->update($set, ['id' => $user['id']]);

    if (1 !== $affectedRows) {
        $app->halt(200, __t('password_reset_error'));
    }

    $data = ['new_password' => $password];
    Mail::send('mail/forgot-password.twig.html', $data, function ($message) use ($user) {
        $message->setSubject(__t('password_reset_new_password_email_subject'));
        $message->setTo($user['email']);
    });

    $app->halt(200, __t('password_reset_new_temporary_password_sent'));

})->name('auth_reset_password');

$app->post("/$v/auth/forgot-password/?", function () use ($app, $acl, $ZendDb) {
    if (!isset($_POST['email'])) {
        return JsonView::render([
            'success' => false,
            'message' => __t('password_forgot_invalid_email')
        ]);
    }

    $DirectusUsersTableGateway = new DirectusUsersTableGateway($ZendDb, $acl);
    $user = $DirectusUsersTableGateway->findOneBy('email', $_POST['email']);

    if (false === $user) {
        return JsonView::render([
            'success' => false,
            'message' => __t('password_forgot_no_account_found')
        ]);
    }

    $set = [];
    $set['reset_token'] = StringUtils::randomString(30);
    $set['reset_expiration'] = DateUtils::inDays(2);

    // Skip ACL
    $DirectusUsersTableGateway = new \Zend\Db\TableGateway\TableGateway('directus_users', $ZendDb);
    $affectedRows = $DirectusUsersTableGateway->update($set, ['id' => $user['id']]);

    if (1 !== $affectedRows) {
        return JsonView::render([
            'success' => false
        ]);
    }

    $data = ['reset_token' => $set['reset_token']];
    Mail::send('mail/reset-password.twig.html', $data, function ($message) use ($user) {
        $message->setSubject(__t('password_forgot_password_reset_email_subject'));
        $message->setTo($user['email']);
    });

    $success = true;
    return JsonView::render([
        'success' => $success
    ]);

})->name('auth_permissions');

// debug helper
$app->get("/$v/auth/permissions/?", function () use ($app, $acl) {
    if ('production' === DIRECTUS_ENV) {
        return $app->halt('404');
    }
    $groupPrivileges = $acl->getGroupPrivileges();
    JsonView::render(['groupPrivileges' => $groupPrivileges]);
})->name('auth_permissions');

$app->post("/$v/hash/?", function () use ($app) {
    if (!(isset($_POST['password']) && !empty($_POST['password']))) {
        return JsonView::render([
            'success' => false,
            'message' => __t('hash_must_provide_string')
        ]);
    }
    $salt = isset($_POST['salt']) && !empty($_POST['salt']) ? $_POST['salt'] : '';
    $hashedPassword = Auth::hashPassword($_POST['password'], $salt);
    return JsonView::render([
        'success' => true,
        'password' => $hashedPassword
    ]);
});

$app->post("/$v/random/?", function () use ($app) {
    // default random string length
    $length = 32;
    if (array_key_exists('length', $_POST)) {
        $length = (int)$_POST['length'];
    }

    $randomString = StringUtils::randomString($length);

    return JsonView::render([
        'random' => $randomString
    ]);
});

$app->get("/$v/privileges/:groupId(/:tableName)/?", function ($groupId, $tableName = null) use ($acl, $ZendDb, $params, $requestPayload, $app) {
    $currentUser = Auth::getUserRecord();
    $myGroupId = $currentUser['group'];

    if ($myGroupId != 1) {
        throw new Exception(__t('permission_denied'));
    }

    $privileges = new DirectusPrivilegesTableGateway($ZendDb, $acl);
    $response = $privileges->fetchPerTable($groupId, $tableName);
    if (!$response) {
        $app->response()->setStatus(404);
        $response = [
            'message' => __t('unable_to_find_privileges_for_x_in_group_x', ['table' => $tableName, 'group_id' => $groupId]),
            'success' => false
        ];
    }

    return JsonView::render($response);
});

$app->map("/$v/privileges/:groupId/?", function ($groupId) use ($acl, $ZendDb, $params, $requestPayload, $app, $authentication) {
    $currentUser = $authentication->getUserRecord();
    $myGroupId = $currentUser['group'];

    if ($myGroupId != 1) {
        throw new Exception(__t('permission_denied'));
    }

    if (isset($requestPayload['addTable'])) {
        $isTableNameAlphanumeric = preg_match("/[a-z0-9]+/i", $requestPayload['table_name']);
        $zeroOrMoreUnderscoresDashes = preg_match("/[_-]*/i", $requestPayload['table_name']);

        if (!($isTableNameAlphanumeric && $zeroOrMoreUnderscoresDashes)) {
            $app->response->setStatus(400);
            return JsonView::render(['message' => __t('invalid_table_name')]);
        }

        unset($requestPayload['addTable']);

        $schema = Bootstrap::get('schemaManager');
        if (!$schema->tableExists($requestPayload['table_name'])) {
            $app->emitter->run('table.create:before', $requestPayload['table_name']);
            // Through API:
            // Remove spaces and symbols from table name
            // And in lowercase
            $requestPayload['table_name'] = SchemaUtils::cleanTableName($requestPayload['table_name']);
            $schema->createTable($requestPayload['table_name']);
            $app->emitter->run('table.create', $requestPayload['table_name']);
            $app->emitter->run('table.create:after', $requestPayload['table_name']);
        }
    }

    $privileges = new DirectusPrivilegesTableGateway($ZendDb, $acl);
    $response = $privileges->insertPrivilege($requestPayload);

    return JsonView::render($response);
})->via('POST');

$app->map("/$v/privileges/:groupId/:privilegeId", function ($groupId, $privilegeId) use ($acl, $ZendDb, $params, $requestPayload, $app) {
    $currentUser = Auth::getUserRecord();
    $myGroupId = $currentUser['group'];

    if ($myGroupId != 1) {
        throw new Exception(__t('permission_denied'));
    }

    $privileges = new DirectusPrivilegesTableGateway($ZendDb, $acl);

    if (isset($requestPayload['activeState'])) {
        if ($requestPayload['activeState'] !== 'all') {
            $priv = $privileges->findByStatus($requestPayload['table_name'], $requestPayload['group_id'], $requestPayload['activeState']);
            if ($priv) {
                $requestPayload['id'] = $priv['id'];
                $requestPayload['status_id'] = $priv['status_id'];
            } else {
                unset($requestPayload['id']);
                $requestPayload['status_id'] = $requestPayload['activeState'];
                $response = $privileges->insertPrivilege($requestPayload);
                return JsonView::render($response);
            }
        }
    }

    $response = $privileges->updatePrivilege($requestPayload);

    return JsonView::render($response);
})->via('PUT');

/**
 * ENTRIES COLLECTION
 */

$app->map("/$v/tables/:table/rows/?", function ($table) use ($acl, $ZendDb, $params, $requestPayload, $app) {
    $currentUser = Auth::getUserInfo();
    $id = null;
    $params['table_name'] = $table;
    $TableGateway = new TableGateway($table, $ZendDb, $acl);

    // any CREATE requests should md5 the email
    if ('directus_users' === $table &&
        in_array($app->request()->getMethod(), ['POST']) &&
        array_key_exists('email', $requestPayload)
    ) {
        $avatar = DirectusUsersTableGateway::get_avatar($requestPayload['email']);
        $requestPayload['avatar'] = $avatar;
    }

    switch ($app->request()->getMethod()) {
        // POST one new table entry
        case 'POST':
            $activityLoggingEnabled = !(isset($_GET['skip_activity_log']) && (1 == $_GET['skip_activity_log']));
            $activityMode = $activityLoggingEnabled ? TableGateway::ACTIVITY_ENTRY_MODE_PARENT : TableGateway::ACTIVITY_ENTRY_MODE_DISABLED;
            $newRecord = $TableGateway->manageRecordUpdate($table, $requestPayload, $activityMode);
            $params[$TableGateway->primaryKeyFieldName] = $newRecord[$TableGateway->primaryKeyFieldName];
            break;
        // PUT a change set of table entries
        case 'PUT':
            if (!is_numeric_array($requestPayload)) {
                $params[$TableGateway->primaryKeyFieldName] = $requestPayload[$TableGateway->primaryKeyFieldName];
                $requestPayload = [$requestPayload];
            }
            $TableGateway->updateCollection($requestPayload);
            break;
    }
    // GET all table entries
    $Table = new TableGateway($table, $ZendDb, $acl);
    $entries = $Table->getEntries($params);
    JsonView::render($entries);
})->via('GET', 'POST', 'PUT');

$app->map("/$v/tables/:table/rows/bulk/?", function ($table) use ($acl, $ZendDb, $params, $requestPayload, $app) {
    $rows = array_key_exists('rows', $requestPayload) ? $requestPayload['rows'] : false;
    if (!is_array($rows) || count($rows) <= 0) {
        throw new Exception(__t('rows_no_specified'));
    }

    $TableGateway = new TableGateway($table, $ZendDb, $acl);
    $primaryKeyFieldName = $TableGateway->primaryKeyFieldName;

    $rowIds = [];
    foreach ($rows as $row) {
        if (!array_key_exists($primaryKeyFieldName, $row)) {
            throw new Exception(__t('row_without_primary_key_field'));
        }
        array_push($rowIds, $row[$primaryKeyFieldName]);
    }

    $where = new \Zend\Db\Sql\Where;

    if ($app->request()->isDelete()) {
        $TableGateway->delete($where->in($primaryKeyFieldName, $rowIds));
    } else {
        foreach ($rows as $row) {
            $TableGateway->updateCollection($row);
        }
    }

    $entries = $TableGateway->getEntries($params);
    JsonView::render($entries);
})->via('POST', 'PATCH', 'PUT', 'DELETE');

$app->get("/$v/tables/:table/typeahead/?", function ($table, $query = null) use ($ZendDb, $acl, $params, $app) {
    $Table = new TableGateway($table, $ZendDb, $acl);

    if (!isset($params['columns'])) {
        $params['columns'] = '';
    }

    $columns = ($params['columns']) ? explode(',', $params['columns']) : [];
    if (count($columns) > 0) {
        $params['group_by'] = $columns[0];

        if (isset($params['q'])) {
            $params['adv_where'] = "`{$columns[0]}` like '%{$params['q']}%'";
            $params['perPage'] = 50;
        }
    }

    if (!$query) {
        $entries = $Table->getEntries($params);
    }

    $entries = $entries['rows'];
    $response = [];
    foreach ($entries as $entry) {
        $val = '';
        $tokens = [];
        foreach ($columns as $col) {
            array_push($tokens, $entry[$col]);
        }
        $val = implode(' ', $tokens);
        array_push($response, ['value' => $val, 'tokens' => $tokens, 'id' => $entry['id']]);
    }
    JsonView::render($response);
});

$app->map("/$v/tables/:table/rows/:id/?", function ($table, $id) use ($ZendDb, $acl, $params, $requestPayload, $app, $authentication) {
    $currentUser = $authentication->getUserInfo();
    $params['table_name'] = $table;

    // any UPDATE requests should md5 the email
    if ('directus_users' === $table &&
        in_array($app->request()->getMethod(), ['PUT', 'PATCH']) &&
        array_key_exists('email', $requestPayload)
    ) {
        $avatar = DirectusUsersTableGateway::get_avatar($requestPayload['email']);
        $requestPayload['avatar'] = $avatar;
    }

    $TableGateway = new TableGateway($table, $ZendDb, $acl);
    switch ($app->request()->getMethod()) {
        // PUT an updated table entry
        case 'PATCH':
        case 'PUT':
            $requestPayload[$TableGateway->primaryKeyFieldName] = $id;
            $activityLoggingEnabled = !(isset($_GET['skip_activity_log']) && (1 == $_GET['skip_activity_log']));
            $activityMode = $activityLoggingEnabled ? TableGateway::ACTIVITY_ENTRY_MODE_PARENT : TableGateway::ACTIVITY_ENTRY_MODE_DISABLED;
            $TableGateway->manageRecordUpdate($table, $requestPayload, $activityMode);
            break;
        // DELETE a given table entry
        case 'DELETE':
            echo $TableGateway->delete([$TableGateway->primaryKeyFieldName => $id]);
            return;
    }

    $params[$TableGateway->primaryKeyFieldName] = $id;
    // GET a table entry
    $Table = new TableGateway($table, $ZendDb, $acl);
    $response = $Table->getEntries($params);
    if (!$response) {
        $response = [
            'message' => __t('unable_to_find_record_in_x_with_id_x', ['table' => $table, 'id' => $id]),
            'success' => false
        ];
    }
    JsonView::render($response);
})->via('DELETE', 'GET', 'PUT', 'PATCH');

/**
 * ACTIVITY COLLECTION
 */

// @todo: create different activity endpoints
// ex: /activity/:table, /activity/recents/:days
$app->get("/$v/activity/?", function () use ($params, $ZendDb, $acl) {
    $Activity = new DirectusActivityTableGateway($ZendDb, $acl);
    // @todo move this to backbone collection
    if (!$params['adv_search']) {
        unset($params['perPage']);
        $params['adv_search'] = 'datetime >= "' . DateUtils::daysAgo(30) . '"';
    }
    $new_get = $Activity->fetchFeed($params);
    $new_get['active'] = $new_get['total'];
    JsonView::render($new_get);
});

/**
 * COLUMNS COLLECTION
 */

// GET all table columns, or POST one new table column

$app->map("/$v/tables/:table/columns/?", function ($table_name) use ($ZendDb, $params, $requestPayload, $app, $acl) {
    $params['table_name'] = $table_name;
    if ($app->request()->isPost()) {
        /**
         * @todo  check if a column by this name already exists
         * @todo  build this into the method when we shift its location to the new layer
         */
        if (!$acl->hasTablePrivilege($table_name, 'alter')) {
            throw new UnauthorizedTableAlterException(__t('permission_table_alter_access_forbidden_on_table', [
                'table_name' => $table_name
            ]));
        }

        $tableGateway = new TableGateway($table_name, $ZendDb, $acl);
        // Through API:
        // Remove spaces and symbols from column name
        // And in lowercase
        $requestPayload['column_name'] = SchemaUtils::cleanColumnName($requestPayload['column_name']);
        $params['column_name'] = $tableGateway->addColumn($table_name, $requestPayload);
    }

    $response = TableSchema::getSchemaArray($table_name, $params);

    JsonView::render($response);
})->via('GET', 'POST');

// GET or PUT one column

$app->map("/$v/tables/:table/columns/:column/?", function ($table, $column) use ($ZendDb, $acl, $params, $requestPayload, $app) {
    if ($app->request()->isDelete()) {
        $tableGateway = new TableGateway($table, $ZendDb, $acl);
        $success = $tableGateway->dropColumn($column);

        $response = [
            'message' => __t('unable_to_remove_column_x', ['column_name' => $column]),
            'success' => false
        ];

        if ($success) {
            $response['success'] = true;
            $response['message'] = __t('column_x_was_removed');
        }

        return JsonView::render($response);
    }

    $params['column_name'] = $column;
    $params['table_name'] = $table;
    // This `type` variable is used on the client-side
    // Not need on server side.
    // @TODO: We should probably stop using it on the client-side
    unset($requestPayload['type']);
    // Add table name to dataset. @TODO more clarification would be useful
    // Also This would return an Error because of $row not always would be an array.
    if ($requestPayload) {
        foreach ($requestPayload as &$row) {
            if (is_array($row)) {
                $row['table_name'] = $table;
            }
        }
    }

    if ($app->request()->isPut()) {
        $TableGateway = new TableGateway('directus_columns', $ZendDb, $acl);
        $columnData = $TableGateway->select([
            'table_name' => $table,
            'column_name' => $column
        ])->current();

        if ($columnData) {
            $columnData = $columnData->toArray();
            $requestPayload = ArrayUtils::pick($requestPayload, [
                'data_type',
                'ui',
                'hidden_input',
                'hidden_list',
                'required',
                'relationship_type',
                'related_table',
                'junction_table',
                'junction_key_left',
                'junction_key_right',
                'sort',
                'comment'
            ]);

            $requestPayload['id'] = $columnData['id'];
            $TableGateway->updateCollection($requestPayload);
        }
    }

    $response = TableSchema::getSchemaArray($table, $params);
    if (!$response) {
        $response = [
            'message' => __t('unable_to_find_column_x', ['column' => $column]),
            'success' => false
        ];
    }
    JsonView::render($response);
})->via('GET', 'PUT', 'DELETE');

$app->post("/$v/tables/:table/columns/:column/?", function ($table, $column) use ($ZendDb, $acl, $requestPayload, $app) {
    $TableGateway = new TableGateway('directus_columns', $ZendDb, $acl);
    $data = $requestPayload;
    // @TODO: check whether this condition is still needed
    if (isset($data['type'])) {
        $data['data_type'] = $data['type'];
        $data['relationship_type'] = $data['type'];
        unset($data['type']);
    }
    //$data['column_name'] = $data['junction_key_left'];
    $data['column_name'] = $column;
    $data['table_name'] = $table;
    $row = $TableGateway->findOneByArray(['table_name' => $table, 'column_name' => $column]);

    if ($row) {
        $data['id'] = $row['id'];
    }
    $newRecord = $TableGateway->manageRecordUpdate('directus_columns', $data, TableGateway::ACTIVITY_ENTRY_MODE_DISABLED);
    $_POST['id'] = $newRecord['id'];
    JsonView::render($_POST);
});
/**
 * GROUPS COLLECTION
 */

/** (Optional slim route params break when these two routes are merged) */

$app->map("/$v/groups/?", function () use ($app, $ZendDb, $acl, $requestPayload, $authentication) {
    // @TODO need PUT
    $GroupsTableGateway = new TableGateway('directus_groups', $ZendDb, $acl);
    $tableName = 'directus_groups';
    $GroupsTableGateway = new TableGateway($tableName, $ZendDb, $acl);
    $currentUser = $authentication->getUserInfo();
    switch ($app->request()->getMethod()) {
        case 'POST':
            $newRecord = $GroupsTableGateway->manageRecordUpdate($tableName, $requestPayload);
            $newGroupId = $newRecord['id'];
            $newGroup = $GroupsTableGateway->find($newGroupId);
            $outputData = $newGroup;
            break;
        case 'GET':
        default:
            $get_new = $GroupsTableGateway->getEntries();
            $outputData = $get_new;
    }

    JsonView::render($outputData);
})->via('GET', 'POST');

$app->get("/$v/groups/:id/?", function ($id = null) use ($ZendDb, $acl) {
    // @TODO need POST and PUT
    // Hardcoding ID temporarily
    is_null($id) ? $id = 1 : null;
    $tableName = 'directus_groups';
    $Groups = new TableGateway($tableName, $ZendDb, $acl);
    $response = $Groups->find($id);
    if (!$response) {
        $response = [
            'message' => __t('unable_to_find_group_with_id_x', ['id' => $id]),
            'success' => false
        ];
    }

    $columns = TableSchema::getAllNonAliasTableColumns($tableName);
    $response = SchemaManager::parseRecordValuesByType($response, $columns);

    JsonView::render($response);
});

/**
 * FILES COLLECTION
 */

$app->map("/$v/files(/:id)/?", function ($id = null) use ($app, $ZendDb, $acl, $params, $requestPayload, $authentication) {
    if (!is_null($id))
        $params['id'] = $id;

    $table = 'directus_files';
    $currentUser = $authentication->getUserInfo();
    $TableGateway = new TableGateway($table, $ZendDb, $acl);
    $activityLoggingEnabled = !(isset($_GET['skip_activity_log']) && (1 == $_GET['skip_activity_log']));
    $activityMode = $activityLoggingEnabled ? TableGateway::ACTIVITY_ENTRY_MODE_PARENT : TableGateway::ACTIVITY_ENTRY_MODE_DISABLED;

    switch ($app->request()->getMethod()) {
        case 'POST':
            $requestPayload['user'] = $currentUser['id'];
            $requestPayload['date_uploaded'] = DateUtils::now();

            // When the file is uploaded there's not a data key
            if (array_key_exists('data', $requestPayload)) {
                $Files = new \Directus\Files\Files();
                if (!array_key_exists('type', $requestPayload) || strpos($requestPayload['type'], 'embed/') === 0) {
                    $recordData = $Files->saveEmbedData($requestPayload);
                } else {
                    $recordData = $Files->saveData($requestPayload['data'], $requestPayload['name']);
                }

                $requestPayload = array_merge($recordData, ArrayUtils::omit($requestPayload, ['data', 'name']));
            }
            $newRecord = $TableGateway->manageRecordUpdate($table, $requestPayload, $activityMode);
            $params['id'] = $newRecord['id'];
            break;
        case 'PATCH':
            $requestPayload['id'] = $id;
        case 'PUT':
            if (!is_null($id)) {
                $TableGateway->manageRecordUpdate($table, $requestPayload, $activityMode);
                break;
            }
    }

    $Files = new TableGateway($table, $ZendDb, $acl);
    $response = $Files->getEntries($params);
    if (!$response) {
        $response = [
            'message' => __t('unable_to_find_file_with_id_x', ['id' => $id]),
            'success' => false
        ];
    }

    JsonView::render($response);
})->via('GET', 'PATCH', 'POST', 'PUT');

/**
 * PREFERENCES COLLECTION
 */

$app->map("/$v/tables/:table/preferences/?", function ($table) use ($ZendDb, $acl, $params, $requestPayload, $app, $authentication) {
    $currentUser = $authentication->getUserInfo();
    $params['table_name'] = $table;
    $Preferences = new DirectusPreferencesTableGateway($ZendDb, $acl);
    $TableGateway = new TableGateway('directus_preferences', $ZendDb, $acl);
    switch ($app->request()->getMethod()) {
        case 'PUT':
            $TableGateway->manageRecordUpdate('directus_preferences', $requestPayload, TableGateway::ACTIVITY_ENTRY_MODE_DISABLED);
            break;
        case 'POST':
            //If Already exists and not saving with title, then updateit!
            $existing = $Preferences->fetchByUserAndTableAndTitle($currentUser['id'], $table, isset($requestPayload['title']) ? $requestPayload['title'] : null);
            if (!empty($existing)) {
                $requestPayload['id'] = $existing['id'];
            }
            $requestPayload['user'] = $currentUser['id'];
            $id = $TableGateway->manageRecordUpdate('directus_preferences', $requestPayload, TableGateway::ACTIVITY_ENTRY_MODE_DISABLED);
            break;
        case 'DELETE':
            if ($requestPayload['user'] != $currentUser['id']) {
                return;
            }

            if (isset($requestPayload['id'])) {
                echo $TableGateway->delete(['id' => $requestPayload['id']]);
            } else if (isset($requestPayload['title']) && isset($requestPayload['table_name'])) {
                $jsonResponse = $Preferences->fetchByUserAndTableAndTitle($currentUser['id'], $requestPayload['table_name'], $requestPayload['title']);
                if ($jsonResponse['id']) {
                    echo $TableGateway->delete(['id' => $jsonResponse['id']]);
                } else {
                    echo 1;
                }
            }

            return;
    }

    //If Title is set then return this version
    if (isset($requestPayload['title'])) {
        $params['newTitle'] = $requestPayload['title'];
    }

    if (isset($params['newTitle'])) {
        $jsonResponse = $Preferences->fetchByUserAndTableAndTitle($currentUser['id'], $table, $params['newTitle']);
    } else {
        $jsonResponse = $Preferences->fetchByUserAndTableAndTitle($currentUser['id'], $table);
    }

    if (!$jsonResponse) {
        $app->response()->setStatus(404);
        $jsonResponse = [
            'message' => __t('unable_to_find_preferences'),
            'success' => false
        ];
    }

    JsonView::render($jsonResponse);
})->via('GET', 'POST', 'PUT', 'DELETE');

$app->get("/$v/preferences/:table", function ($table) use ($app, $ZendDb, $acl) {
    $currentUser = Auth::getUserInfo();
    $params['table_name'] = $table;
    $Preferences = new DirectusPreferencesTableGateway($ZendDb, $acl);
    $jsonResponse = $Preferences->fetchSavedPreferencesByUserAndTable($currentUser['id'], $table);
    JsonView::render($jsonResponse);
});

/**
 * BOOKMARKS COLLECTION
 */

$app->map("/$v/bookmarks(/:id)/?", function ($id = null) use ($params, $app, $ZendDb, $acl, $requestPayload, $authentication) {
    $currentUser = $authentication->getUserInfo();
    $bookmarks = new DirectusBookmarksTableGateway($ZendDb, $acl);
    switch ($app->request()->getMethod()) {
        case 'PUT':
            $bookmarks->updateBookmark($requestPayload);
            $id = $requestPayload['id'];
            break;
        case 'POST':
            $requestPayload['user'] = $currentUser['id'];
            $id = $bookmarks->insertBookmark($requestPayload);
            break;
        case 'DELETE':
            $bookmark = $bookmarks->fetchByUserAndId($currentUser['id'], $id);
            if ($bookmark) {
                echo $bookmarks->delete(['id' => $id]);
            }
            return;
    }
    $jsonResponse = $bookmarks->fetchByUserAndId($currentUser['id'], $id);
    JsonView::render($jsonResponse);
})->via('GET', 'POST', 'PUT', 'DELETE');

/**
 * REVISIONS COLLECTION
 */

$app->get("/$v/tables/:table/rows/:id/revisions/?", function ($table, $id) use ($acl, $ZendDb, $params) {
    $params['table_name'] = $table;
    $params['id'] = $id;
    $Activity = new DirectusActivityTableGateway($ZendDb, $acl);
    $revisions = $Activity->fetchRevisions($id, $table);
    JsonView::render($revisions);
});

/**
 * SETTINGS COLLECTION
 */

$app->map("/$v/settings(/:id)/?", function ($id = null) use ($acl, $ZendDb, $params, $requestPayload, $app) {

    $Settings = new DirectusSettingsTableGateway($ZendDb, $acl);

    switch ($app->request()->getMethod()) {
        case 'POST':
        case 'PUT':
            $data = $requestPayload;
            unset($data['id']);
            $Settings->setValues($id, $data);
            break;
    }

    $response = $Settings->fetchAll();
    if (!is_null($id)) {
        $response = array_key_exists($id, $response) ? $response[$id] : null;
    }

    if (!$response) {
        $response = [
            'message' => __t('unable_to_find_setting_collection_x', ['collection' => $id]),
            'success' => false
        ];
    }

    JsonView::render($response);
})->via('GET', 'POST', 'PUT');

/**
 * /tables
 * List of viewable tables for the authenticated user group
 *
 * return list of objects with the name of the table
 * Ex. [{name: 'articles'}, {name: 'projects'}]
 */
$app->get("/$v/tables/?", function () use ($ZendDb, $acl, $app) {
    $tablesNames = TableSchema::getTablenames(false);

    $tables = array_map(function ($table) {
        return ['table_name' => $table];
    }, $tablesNames);

    JsonView::render($tables);
});

// GET and PUT table details
$app->map("/$v/tables/:table/?", function ($table) use ($ZendDb, $acl, $params, $requestPayload, $app) {
    if ($app->request()->isDelete()) {
        $tableGateway = new TableGateway($table, $ZendDb, $acl);
        $success = $tableGateway->drop();

        $response = [
            'message' => __t('unable_to_remove_table_x', ['table_name' => $table]),
            'success' => false
        ];

        if ($success) {
            $response['success'] = true;
            $response['message'] = __t('table_x_was_removed');
        }

        return JsonView::render($response);
    }

    $TableGateway = new TableGateway('directus_tables', $ZendDb, $acl, null, null, null, 'table_name');
    $ColumnsTableGateway = new TableGateway('directus_columns', $ZendDb, $acl);
    /* PUT updates the table */
    if ($app->request()->isPut()) {
        $data = $requestPayload;
        $table_settings = [
            'table_name' => $data['table_name'],
            'hidden' => (int)$data['hidden'],
            'single' => (int)$data['single'],
            'footer' => (int)$data['footer'],
            'primary_column' => array_key_exists('primary_column', $data) ? $data['primary_column'] : ''
        ];

        //@TODO: Possibly pretty this up so not doing direct inserts/updates
        $set = $TableGateway->select(['table_name' => $table])->toArray();

        //If item exists, update, else insert
        if (count($set) > 0) {
            $TableGateway->update($table_settings, ['table_name' => $table]);
        } else {
            $TableGateway->insert($table_settings);
        }

        $column_settings = [];
        foreach ($data['columns'] as $col) {
            $columnData = [
                'table_name' => $table,
                'column_name' => $col['column_name'],
                'ui' => $col['ui'],
                'hidden_input' => $col['hidden_input'] ? 1 : 0,
                'hidden_list' => $col['hidden_list'] ? 1 : 0,
                'required' => $col['required'] ? 1 : 0,
                'sort' => array_key_exists('sort', $col) ? $col['sort'] : 99999,
                'comment' => array_key_exists('comment', $col) ? $col['comment'] : ''
            ];

            // hotfix #1069 single_file UI not saving relational settings
            $extraFields = ['data_type', 'relationship_type', 'related_table', 'junction_key_right'];
            foreach ($extraFields as $field) {
                if (array_key_exists($field, $col)) {
                    $columnData[$field] = $col[$field];
                }
            }

            $existing = $ColumnsTableGateway->select(['table_name' => $table, 'column_name' => $col['column_name']])->toArray();
            if (count($existing) > 0) {
                $columnData['id'] = $existing[0]['id'];
            }

            array_push($column_settings, $columnData);
        }


        $ColumnsTableGateway->updateCollection($column_settings);
    }

    $response = TableSchema::getTable($table);

    if (!$response) {
        $response = [
            'message' => __t('unable_to_find_table_x', ['table_name' => $table]),
            'success' => false
        ];
    }
    JsonView::render($response);
})->via('GET', 'PUT', 'DELETE')->name('table_meta');

/**
 * UPLOAD COLLECTION
 */

$app->post("/$v/upload/?", function () use ($params, $requestPayload, $app, $acl, $ZendDb) {
    // $Transfer = new Files\Transfer();
    // $Storage = new Files\Storage\Storage();
    $Files = new Directus\Files\Files();
    $result = [];
    foreach ($_FILES as $file) {
        $result[] = $Files->upload($file);
    }
    JsonView::render($result);
});

$app->post("/$v/upload/link/?", function () use ($params, $requestPayload, $app, $acl, $ZendDb) {
    $Files = new \Directus\Files\Files();
    $result = [
        'message' => __t('invalid_unsupported_url'),
        'success' => false
    ];

    $app->response->setStatus(400);

    if (isset($_POST['link']) && filter_var($_POST['link'], FILTER_VALIDATE_URL)) {
        $fileData = ['caption' => '', 'tags' => '', 'location' => ''];
        $linkInfo = $Files->getLink($_POST['link']);

        if ($linkInfo) {
            $currentUser = Auth::getUserInfo();
            $app->response->setStatus(200);
            $fileData = array_merge($fileData, $linkInfo);

            $result = [];
            $result[] = [
                'type' => $fileData['type'],
                'name' => $fileData['name'],
                'title' => $fileData['title'],
                'tags' => $fileData['tags'],
                'caption' => $fileData['caption'],
                'location' => $fileData['location'],
                'charset' => $fileData['charset'],
                'size' => $fileData['size'],
                'width' => $fileData['width'],
                'height' => $fileData['height'],
                'html' => isset($fileData['html']) ? $fileData['html'] : null,
                'embed_id' => (isset($fileData['embed_id'])) ? $fileData['embed_id'] : '',
                'data' => (isset($fileData['data'])) ? $fileData['data'] : null,
                'user' => $currentUser['id']
                //'date_uploaded' => $fileData['date_uploaded'] . ' UTC',
            ];
        }
    }

    JsonView::render($result);
});

$app->get("/$v/messages/rows/?", function () use ($params, $requestPayload, $app, $acl, $ZendDb, $authentication) {
    $currentUser = $authentication->getUserInfo();

    if (isset($_GET['max_id'])) {
        $messagesRecipientsTableGateway = new DirectusMessagesRecipientsTableGateway($ZendDb, $acl);
        $ids = $messagesRecipientsTableGateway->getMessagesNewerThan($_GET['max_id'], $currentUser['id']);
        if (sizeof($ids) > 0) {
            $messagesTableGateway = new DirectusMessagesTableGateway($ZendDb, $acl);
            $result = $messagesTableGateway->fetchMessagesInboxWithHeaders($currentUser['id'], $ids);
            return JsonView::render($result);
        } else {
            $result = $messagesRecipientsTableGateway->countMessages($currentUser['id']);
            return JsonView::render($result);
        }
    }

    $messagesTableGateway = new DirectusMessagesTableGateway($ZendDb, $acl);
    $result = $messagesTableGateway->fetchMessagesInboxWithHeaders($currentUser['id']);
    JsonView::render($result);
});

$app->get("/$v/messages/rows/:id/?", function ($id) use ($params, $requestPayload, $app, $acl, $ZendDb) {
    $currentUser = Auth::getUserInfo();
    $messagesTableGateway = new DirectusMessagesTableGateway($ZendDb, $acl);
    $message = $messagesTableGateway->fetchMessageWithRecipients($id, $currentUser['id']);

    if (!isset($message)) {
        header('HTTP/1.0 404 Not Found');
        return JsonView::render(['message' => __t('message_not_found')]);
    }

    JsonView::render($message);
});

$app->map("/$v/messages/rows/:id/?", function ($id) use ($params, $requestPayload, $app, $acl, $ZendDb) {
    $currentUser = Auth::getUserInfo();
    $messagesTableGateway = new DirectusMessagesTableGateway($ZendDb, $acl);
    $messagesRecipientsTableGateway = new DirectusMessagesRecipientsTableGateway($ZendDb, $acl);

    $message = $messagesTableGateway->fetchMessageWithRecipients($id, $currentUser['id']);

    $ids = [$message['id']];
    $message['read'] = 1;

    foreach ($message['responses']['rows'] as &$response) {
        $ids[] = $response['id'];
        $response['read'] = 1;
    }

    $messagesRecipientsTableGateway->markAsRead($ids, $currentUser['id']);

    JsonView::render($message);
})->via('PATCH');

$app->post("/$v/messages/rows/?", function () use ($params, $requestPayload, $app, $acl, $ZendDb) {
    $currentUser = Auth::getUserInfo();

    // Unpack recipients
    $recipients = explode(',', $requestPayload['recipients']);
    $groupRecipients = [];
    $userRecipients = [];

    foreach ($recipients as $recipient) {
        $typeAndId = explode('_', $recipient);
        if ($typeAndId[0] == 0) {
            $userRecipients[] = $typeAndId[1];
        } else {
            $groupRecipients[] = $typeAndId[1];
        }
    }

    if (count($groupRecipients) > 0) {
        $usersTableGateway = new DirectusUsersTableGateway($ZendDb, $acl);
        $result = $usersTableGateway->findActiveUserIdsByGroupIds($groupRecipients);
        foreach ($result as $item) {
            $userRecipients[] = $item['id'];
        }
    }

    $userRecipients[] = $currentUser['id'];

    $messagesTableGateway = new DirectusMessagesTableGateway($ZendDb, $acl);
    $id = $messagesTableGateway->sendMessage($requestPayload, array_unique($userRecipients), $currentUser['id']);

    if ($id) {
        $Activity = new DirectusActivityTableGateway($ZendDb, $acl);
        $requestPayload['id'] = $id;
        $Activity->recordMessage($requestPayload, $currentUser['id']);
    }

    foreach ($userRecipients as $recipient) {
        $usersTableGateway = new DirectusUsersTableGateway($ZendDb, $acl);
        $user = $usersTableGateway->findOneBy('id', $recipient);

        if (isset($user) && $user['email_messages'] == 1) {
            $data = ['message' => $requestPayload['message']];
            $view = 'mail/notification.twig.html';
            Mail::send($view, $data, function ($message) use ($user, $requestPayload) {
                $message->setSubject($requestPayload['subject']);
                $message->setTo($user['email']);
            });
        }
    }

    $message = $messagesTableGateway->fetchMessageWithRecipients($id, $currentUser['id']);

    JsonView::render($message);
});

$app->get("/$v/messages/recipients/?", function () use ($params, $requestPayload, $app, $acl, $ZendDb) {
    $tokens = explode(' ', $_GET['q']);

    $usersTableGateway = new DirectusUsersTableGateway($ZendDb, $acl);
    $users = $usersTableGateway->findUserByFirstOrLastName($tokens);

    $groupsTableGateway = new DirectusGroupsTableGateway($ZendDb, $acl);
    $groups = $groupsTableGateway->findUserByFirstOrLastName($tokens);

    $result = array_merge($groups, $users);

    JsonView::render($result);
});

$app->post("/$v/comments/?", function () use ($params, $requestPayload, $app, $acl, $ZendDb) {
    $currentUser = Auth::getUserInfo();
    $params['table_name'] = 'directus_messages';
    $TableGateway = new TableGateway('directus_messages', $ZendDb, $acl);

    $groupRecipients = [];
    $userRecipients = [];

    preg_match_all('/@\[.*? /', $requestPayload['message'], $results);
    $results = $results[0];

    if (count($results) > 0) {
        foreach ($results as $result) {
            $result = substr($result, 2);
            $typeAndId = explode('_', $result);
            if ($typeAndId[0] == 0) {
                $userRecipients[] = $typeAndId[1];
            } else {
                $groupRecipients[] = $typeAndId[1];
            }
        }

        if (count($groupRecipients) > 0) {
            $usersTableGateway = new DirectusUsersTableGateway($ZendDb, $acl);
            $result = $usersTableGateway->findActiveUserIdsByGroupIds($groupRecipients);
            foreach ($result as $item) {
                $userRecipients[] = $item['id'];
            }
        }

        $messagesTableGateway = new DirectusMessagesTableGateway($ZendDb, $acl);
        $id = $messagesTableGateway->sendMessage($requestPayload, array_unique($userRecipients), $currentUser['id']);
        $requestPayload['id'] = $params['id'] = $id;

        preg_match_all('/@\[.*?\]/', $requestPayload['message'], $results);
        $messageBody = $requestPayload['message'];
        $results = $results[0];

        $recipientString = '';
        $len = count($results);
        $i = 0;
        foreach ($results as $result) {
            $newresult = substr($result, 0, -1);
            $newresult = substr($newresult, strpos($newresult, ' ') + 1);
            $messageBody = str_replace($result, $newresult, $messageBody);

            if ($i == $len - 1) {
                if ($i > 0) {
                    $recipientString .= ' and ' . $newresult;
                } else {
                    $recipientString .= $newresult;
                }
            } else {
                $recipientString .= $newresult . ', ';
            }
            $i++;
        }

        foreach ($userRecipients as $recipient) {
            $usersTableGateway = new DirectusUsersTableGateway($ZendDb, $acl);
            $user = $usersTableGateway->findOneBy('id', $recipient);

            if (isset($user) && $user['email_messages'] == 1) {
                $data = ['message' => $requestPayload['message']];
                $view = 'mail/notification.twig.html';
                Mail::send($view, $data, function ($message) use ($user, $requestPayload) {
                    $message->setSubject($requestPayload['subject']);
                    $message->setTo($user['email']);
                });
            }
        }
    }

    $requestPayload['datetime'] = DateUtils::now();
    $newRecord = $TableGateway->manageRecordUpdate('directus_messages', $requestPayload, TableGateway::ACTIVITY_ENTRY_MODE_DISABLED);
    $params['id'] = $newRecord['id'];

    // GET all table entries
    $entries = $TableGateway->getEntries($params);
    JsonView::render($entries);
});

/**
 * EXCEPTION LOG
 */
//$app->post("/$v/exception/?", function () use ($params, $requestPayload, $app, $acl, $ZendDb) {
//    print_r($requestPayload);die();
//    $data = array(
//        'server_addr'   =>$_SERVER['SERVER_ADDR'],
//        'server_port'   =>$_SERVER['SERVER_PORT'],
//        'user_agent'    =>$_SERVER['HTTP_USER_AGENT'],
//        'http_host'     =>$_SERVER['HTTP_HOST'],
//        'request_uri'   =>$_SERVER['REQUEST_URI'],
//        'remote_addr'   =>$_SERVER['REMOTE_ADDR'],
//        'page'          =>$requestPayload['page'],
//        'message'       =>$requestPayload['message'],
//        'user_email'    =>$requestPayload['user_email'],
//        'type'          =>$requestPayload['type']
//    );
//
//    $ctx = stream_context_create(array(
//        'http' => array(
//            'method' => 'POST',
//            'content' => "json=".json_encode($data)."&details=".$requestPayload['details']
//        ))
//    );
//
//    $fp = @fopen($url, 'rb', false, $ctx);
//
//    if (!$fp) {
//        $response = "Failed to log error. File pointer could not be initialized.";
//        $app->getLog()->warn($response);
//    }
//
//    $response = @stream_get_contents($fp);
//
//    if ($response === false) {
//        $response = "Failed to log error. stream_get_contents failed.";
//        $app->getLog()->warn($response);
//    }
//
//    $result = array('response'=>$response);
//
//    JsonView::render($result);
//});

/**
 * UI COLLECTION
 */

$app->map("/$v/tables/:table/columns/:column/:ui/?", function ($table, $column, $ui) use ($acl, $ZendDb, $params, $requestPayload, $app) {
    $TableGateway = new TableGateway('directus_ui', $ZendDb, $acl);
    switch ($app->request()->getMethod()) {
        case 'PUT':
        case 'POST':
            $keys = ['table_name' => $table, 'column_name' => $column, 'ui_name' => $ui];
            $uis = to_name_value($requestPayload, $keys);

            $column_settings = [];
            foreach ($uis as $col) {
                $existing = $TableGateway->select(['table_name' => $table, 'column_name' => $column, 'ui_name' => $ui, 'name' => $col['name']])->toArray();
                if (count($existing) > 0) {
                    $col['id'] = $existing[0]['id'];
                }
                array_push($column_settings, $col);
            }
            $TableGateway->updateCollection($column_settings);
    }
    $UiOptions = new DirectusUiTableGateway($ZendDb, $acl);
    $response = $UiOptions->fetchOptions($table, $column, $ui);
    if (!$response) {
        $app->response()->setStatus(404);
        $response = [
            'message' => __t('unable_to_find_column_x_options_for_x', ['column' => $column, 'ui' => $ui]),
            'success' => false
        ];
    }

    JsonView::render($response);
})->via('GET', 'POST', 'PUT');

$app->notFound(function () use ($app, $acl, $ZendDb) {
    $app->response()->header('Content-Type', 'text/html; charset=utf-8');

    $settingsTable = new DirectusSettingsTableGateway($ZendDb, $acl);
    $settings = $settingsTable->fetchCollection('global');

    $projectName = isset($settings['project_name']) ? $settings['project_name'] : 'Directus';
    $projectLogoURL = '/assets/img/directus-logo-flat.svg';
    if (isset($settings['cms_thumbnail_url']) && $settings['cms_thumbnail_url']) {
        $projectLogoURL = $settings['cms_thumbnail_url'];
    }

    $data = [
        'project_name' => $projectName,
        'project_logo' => $projectLogoURL,
    ];

    $app->render('errors/404.twig.html', $data);
});

/**
 * Run the Router
 */

if (isset($_GET['run_api_router']) && $_GET['run_api_router']) {
    // Run Slim
    $app->response()->header('Content-Type', 'application/json; charset=utf-8');
    $app->run();
}
