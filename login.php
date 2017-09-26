<?php

// If config file doesnt exist, go to install file
if (!file_exists('api/config.php') || filesize('api/config.php') == 0) {
    header('Location: installation/index.php');
    exit;
}

// Composer Autoloader
$loader = require 'vendor/autoload.php';

define('BASE_PATH', dirname(__FILE__));
define('API_PATH', BASE_PATH . '/api');

use Directus\Bootstrap;

require 'api/config.php';

$app = Bootstrap::get('app');

$app->onMissingRequirements(function (array $errors) use ($app) {
    display_missing_requirements_html($errors, $app);
});

$authentication = Bootstrap::get('auth');
$emitter = Bootstrap::get('hookEmitter');
$emitter->run('directus.login.start');

// Temporary solution for disabling this page for logged in users.
if ($authentication->loggedIn()) {
    header('Location: ' . get_directus_path());
    exit;
}

// hotfix
// see: https://github.com/directus/directus/issues/1268
$errorMessage = null;
if (isset($_SESSION['error_message'])) {
    $errorMessage = $_SESSION['error_message'];
    unset($_SESSION['error_message']);
}
// Get current commit hash
$git = __DIR__ . '/.git';
$cacheBuster = Directus\Util\Git::getCloneHash($git);
$buildNumber = \Directus\Util\Git::getGitHash($git) ?: 'Downloaded';

$redirectPath = '';
if (isset($_SESSION['_directus_login_redirect'])) {
    $redirectPath = trim($_SESSION['_directus_login_redirect'], '/');
}

$authList = [];
$authConfig = Bootstrap::get('config')->get('auth');
if ($authConfig) {
    $services = array_keys($authConfig);
    foreach (\Directus\Authentication\Social::supported() as $service) {
        if (in_array($service, $services)) {
            $authList[] = $service;
        }
    }
}

$templateVars = [
    'page' => 'login',
    'inactive' => isset($_GET['inactive']),
    'version' => $app->getVersion(),
    'buildNumber' => $buildNumber,
    'redirectPath' => $redirectPath,
    'errorMessage' => $errorMessage,
    'cacheBuster' => $cacheBuster,
    'apiVersion' => API_VERSION,
    'rootUrl' => get_directus_path(),
    'assetsRoot' => get_directus_path('/assets/'),
    'authList' => $authList,
    'subtitle' => 'Login'
];

$app->render('login.twig', $templateVars);
