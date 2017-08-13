<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Route;
use Directus\Database\TableGateway\RelationalTableGateway as TableGateway;
use Directus\Util\ArrayUtils;
use Directus\Util\DateUtils;
use Directus\View\JsonView;
use Directus\Filesystem\Thumbnailer as ThumbnailerService;
use Exception;

class Thumbnailer extends Route
{
    /**
     * Displays requested thumbnail.
     * If one doesn't exist, it is created, transferred as needed, and returned to the browser
     *
     * @param array $params
     */
    public function show($params = [])
    {
        try {
            // Because Directus\ApplicationApplication::guessOutputFormat()
            // mutates the request object's request_uri to exlude the file extension,
            // we need another way to get it
            $pathInfo = ArrayUtils::get($_SERVER, 'REQUEST_URI');
            $parts = explode('/', $pathInfo);
            $fileName = array_pop($parts);
            array_pop($params); // this will be replaced by the filename w/ extension
            $params[] = $fileName; // replace
            $urlPath = implode('/', $params); // reconstruct the path

            // if the thumb already exists, return it
            $thumbnailer = new ThumbnailerService($this->app->files, $this->app->container->get('config')->get('thumbnailer', []), $urlPath);
            $image = $thumbnailer->get();

            if( ! $image) {
                // now we can create the thumb
                switch ($thumbnailer->action) {

                    // http://image.intervention.io/api/resize
                    case 'contain':
                        $image = $thumbnailer->contain();
                        break;

                    // http://image.intervention.io/api/fit
                    case 'cover':
                    default:
                        $image = $thumbnailer->cover();
                }
            }

            header('Content-type: image/jpeg');
            echo $image;
            exit(0);
        }

        catch (Exception $e) {
            //dd($e);
            header('HTTP/1.0 404 Not Found');
            header('Content-type: image/png');
            $notFoundImagePath = $this->app->container->get('config')->get('thumbnailer.404imageLocation');

            if ($notFoundImagePath) {
                echo file_get_contents($notFoundImagePath);
            }

            exit(0);
        }
    }
}
