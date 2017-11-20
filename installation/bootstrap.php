<?php

require __DIR__ . '/includes/install.functions.php';

$vendorAutoload = BASE_PATH . '/vendor/autoload.php';
$installationAutoload = __DIR__ . '/autoload.php';

if (!file_exists($vendorAutoload)) {
    $vendorAutoload = $installationAutoload;
    include BASE_PATH . '/api/core/functions.php';
}

require $vendorAutoload;

$emitter = new \Directus\Hook\Emitter();
$exceptionHandler = new \Directus\Exception\ExceptionHandler($emitter);

/**
 * @param \Throwable|\Exception $exception
 */
$onError = function ($exception) {
    $now = time();
    $path = get_directus_path();
    $message = $exception->getMessage();

    include __DIR__ . '/views/page.php';
};

$emitter->addAction('application.error', $onError);
