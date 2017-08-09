<?php

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../api/api.php';
require __DIR__ . '/Thumbnailer.php';

try {
    if (! file_exists(__DIR__ . '/../api/config.php') || filesize(__DIR__ . '/../api/config.php') == 0) {
        throw new Exception('Invalid Directus config.');
    }

    $app = \Directus\Bootstrap::get('app');

    $thumbnailer = new Thumbnailer([
        'thumbnailUrlPath' => $app->request->getPathInfo(),
        'configFilePath' => __DIR__ . '/config.json',
    ]);

    // now we can create the thumb
    switch ($thumbnailer->action) {

        // http://image.intervention.io/api/crop
        case 'crop':
            $imagePath = $thumbnailer->crop();
            break;

        // http://image.intervention.io/api/fit
        case 'fit':
        default:
            $imagePath = $thumbnailer->fit();
    }

    header('HTTP/1.1 200 OK');
    header('Content-type: image/jpeg');
    echo file_get_contents($imagePath);
    exit(0);
}

// all exceptions are handled by displaying an 'image not found' png
catch (Exception $e) {
    // dd($e);
    header('Content-type: image/jpeg');
    echo file_get_contents(__DIR__ . '/img-not-found.png');
    exit(0);
}

// dev helper
function dd($c)
{
    var_dump($c);
    die();
}
