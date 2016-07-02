<?php

// Composer Autoloader
// TODO: it doens't work, it depends on the old storage adapters.
// that unfortunately doesn't exists anymore.
$loader = require __DIR__.'/../vendor/autoload.php';

// Non-autoload components
require dirname(__FILE__) . '/../api/config.php';
//require dirname(__FILE__) . '../api/core/db.php';
//require dirname(__FILE__) . '../api/core/functions.php';

define('BASE_PATH', dirname(__DIR__));

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

use Directus\Auth\Provider as Auth;
use Directus\Bootstrap;
use Directus\Db\TableGateway\DirectusStorageAdaptersTableGateway;
use Directus\Db\TableGateway\DirectusUsersTableGateway;
use Directus\MemcacheProvider;
use Directus\View\ExceptionView;
use Zend\Db\TableGateway\TableGateway;

$app = Bootstrap::get('app');

/**
 * Catch user-related exceptions & produce client responses.
 */

$app->config('debug', false);
$exceptionView = new ExceptionView();
$exceptionHandler = function (\Exception $exception) use ($app, $exceptionView) {
    $exceptionView->exceptionHandler($app, $exception);
};
$app->error($exceptionHandler);

/**
 * Bootstrap Providers
 */

$ZendDb = Bootstrap::get('ZendDb');
$acl = Bootstrap::get('acl');

/**
 * Authentication
 */

$DirectusUsersTableGateway = new DirectusUsersTableGateway($acl, $ZendDb);
Auth::setUserCacheRefreshProvider(function($userId) use ($DirectusUsersTableGateway) {
    $cacheFn = function () use ($userId, $DirectusUsersTableGateway) {
        return $DirectusUsersTableGateway->find($userId);
    };
    $cacheKey = MemcacheProvider::getKeyDirectusUserFind($userId);
    $user = $DirectusUsersTableGateway->memcache->getOrCache($cacheKey, $cacheFn, 10800);
    return $user;
});

if(Auth::loggedIn()) {
    $user = Auth::getUserRecord();
    $acl->setUserId($user['id']);
    $acl->setGroupId($user['group']);
}

$app->hook('slim.before.dispatch', function() use ($app) {
    if(!Auth::loggedIn()) {
        http_response_code(403);
        echo "<h1>403 Forbidden</h1>";
        // $app->halt(403); // Never works very well
        exit;
    }
});

$app->get("/:id/:format(/:filename)", function($id, $format, $filename = null) use ($app, $acl, $ZendDb) {
    $notFound = function () {
        http_response_code(404);
        echo "<h1>404 Not found</h1>";
        exit;
    };
    $DirectusMedia = new TableGateway('directus_files', $ZendDb);
    $media = $DirectusMedia->select(function ($select) use ($id) {
        $select->where->equalTo('id', $id);
        $select->limit(1);
    });
    if(0 == $media->count()) {
        return $notFound();
    }
    $media = $media->current();
    if($filename != $media['name']) {
        $correctUrl = $app->urlFor('media_proxy_file', array(
            'id' => $id,
            'format' => $format,
            'filename' => $media['name']
        ));
        return $app->redirect($correctUrl);
    }
    $StorageAdapters = new DirectusStorageAdaptersTableGateway($acl, $ZendDb);
    $storage = $StorageAdapters->find($media['storage_adapter']);
    $params = @json_decode($storage['params'], true);
    $params = empty($params) ? array() : $params;
    $storage['params'] = $params;
    $MediaStorage = \Directus\Files\Storage\Storage::getStorage($storage);
    header('Content-type: ' . $media['type']);
    echo $MediaStorage->getFileContents($media['name'], $storage['destination']);
    exit; // Prevent Slim from overriding our headers
})->conditions(array('id' => '\d+'))
  ->name('media_proxy_file');

foreach (glob("client_auth_proxies/*.php") as $filename)
{
    require_once $filename;
}

$app->run();
