<?php

require __DIR__ . '/../../vendor/autoload.php';

use Directus\Util\ArrayUtils;
use Directus\Filesystem\Thumbnailer;

$basePath = realpath(__DIR__ . '/../../');
// Get Project name
$projectName = \Directus\get_api_project_from_request();

try {
    $app = \Directus\create_app_with_project_name($basePath, $projectName);
} catch (\Exception $e) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => [
            'error' => 8,
            'message' => 'API Project Configuration Not Found: ' . $projectName
        ]
    ]);
    exit;
}

$settings = \Directus\get_directus_thumbnail_settings();
$timeToLive = \Directus\array_get($settings, 'thumbnail_cache_ttl', 86400);
try {

    parse_str($_SERVER['QUERY_STRING'], $queryParams);

    // if the thumb already exists, return it
    $thumbnailer = new Thumbnailer(
        $app->getContainer()->get('filesystem'),
        $app->getContainer()->get('filesystem_thumb'),
        $settings,
        urldecode(\Directus\get_virtual_path()),
        $queryParams
    );

    $image = $thumbnailer->get();

    if (!$image) {
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
    header('Cache-Control: max-age=' . $timeToLive);
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: PUT, GET, POST, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Access-Control-Allow-Headers,Content-Type");
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s \G\M\T', time()));
    header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', time() + $timeToLive));
    echo $image;
    exit(0);
} catch (Exception $e) {
    $filePath = ArrayUtils::get($settings, 'thumbnail_not_found_location');
    if (is_string($filePath) && !empty($filePath) && $filePath[0] !== '/') {
        $filePath = $basePath . '/' . $filePath;
    }

    // TODO: Throw message if the error is a invalid configuration
    if (file_exists($filePath)) {
        $mime = image_type_to_mime_type(exif_imagetype($filePath));

        // TODO: Do we need to cache non-existing files?
        header('Content-type: ' . $mime);
        header("Pragma: cache");
        header('Cache-Control: max-age=' . $timeToLive);
        header('Last-Modified: ' . gmdate('D, d M Y H:i:s \G\M\T', time()));
        header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', time() + $timeToLive));
        echo file_get_contents($filePath);
    } else {
        http_response_code(404);
    }

    exit(0);
}
