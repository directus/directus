<?php
require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../api/api.php';

use Directus\Util\ArrayUtils;
use Directus\Filesystem\Thumbnailer as ThumbnailerService;

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

    header('HTTP/1.1 200 OK');
    header('Content-type: ' . $thumbnailer->getThumbnailMimeType());
    header("Pragma: cache");
    header('Cache-Control: max-age=86400');
    header('Last-Modified: '. gmdate('D, d M Y H:i:s \G\M\T', time()));
    header('Expires: '. gmdate('D, d M Y H:i:s \G\M\T', time() + 86400));
    echo $image;
    exit(0);
}

catch (Exception $e) {
    $filePath = ArrayUtils::get($app->container->get('config')->get('thumbnailer'), '404imageLocation', './img-not-found.png');
    $mime = image_type_to_mime_type(exif_imagetype($filePath));

    header('Content-type: ' . $mime);
    header("Pragma: cache");
    header('Cache-Control: max-age=86400');
    header('Last-Modified: '. gmdate('D, d M Y H:i:s \G\M\T', time()));
    header('Expires: '. gmdate('D, d M Y H:i:s \G\M\T', time() + 86400));
    echo file_get_contents($filePath);
    exit(0);
}
