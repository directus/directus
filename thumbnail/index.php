<?php
require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../api/api.php';

use Directus\Util\ArrayUtils;
use Directus\Filesystem\Thumbnailer as ThumbnailerService;
use Exception;

try {
    $app = \Directus\Bootstrap::get('app');
                                 
    // if the thumb already exists, return it
    $thumbnailer = new ThumbnailerService($app->files, $app->container->get('config')->get('thumbnailer'), $app->request->getPathInfo());
    $image = $thumbnailer->get();
    
    if (! $image) {
        
        // now we can create the thumb
        switch ($thumbnailer->action) {
            
            // http://image.intervention.io/api/resize
            case 'contain':
                $image = $thumbnailer->contain();
                break;
            
            // http://image.intervention.io/api/fit
            case 'crop':
            default:
                $image = $thumbnailer->crop();
        }
    }
    
    header('Content-type: image/jpeg');
    echo $image;
    exit(0);
} 

catch (Exception $e) {
    header('Content-type: image/png');
    echo file_get_contents(ArrayUtils::get($app->container->get('config')->get('thumbnailer'), '404imageLocation', './img-not-found.png'));
    exit(0);
}