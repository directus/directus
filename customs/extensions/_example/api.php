<?php

$app = \Directus\Application\Application::getInstance();

$app->get('/time/?', function () use ($app) {
    $datetime = \Directus\Util\DateUtils::now();

    return $app->response([
        'datetime' => \Directus\Util\DateUtils::convertToISOFormat($datetime, date_default_timezone_get())
    ]);
})->name('_example_time');

/* Example of makeing a route public */
$app->whitelistRoute('_example_time');
