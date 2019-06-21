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

$filesystem = $app->getContainer()->get('filesystem')->getAdapter();

//Remove the project name from the URL
$path = urldecode(\Directus\get_virtual_path());
if (substr($path, 0, strlen($projectName)) == $projectName) {
    $path = substr($path, strlen($projectName));
}

$settings = \Directus\get_directus_proxy_downloads_settings();
$timeToLive = \Directus\array_get($settings, 'proxy_downloads_cache_ttl', 86400);
try {

    //Forward HTTP headers
    $metadata = $filesystem->getMetadata($path);

    header('HTTP/1.1 200 OK');
    if (array_key_exists('mimetype', $metadata)) {
        header('Content-type: ' . $metadata['mimetype']);
    } else {
        $mimetype = $filesystem->getMimetype($path);
        if ($mimetype) {
            header('Content-type: ' . $mimetype);
        }
    }    
    if (array_key_exists('size', $metadata)) {
        header('Content-Length: ' . $metadata['size']);
    } else {
        $size = $filesystem->getSize($path);
        if ($size) {
            header('Content-Length: ' . $size);
        }
    }    
    header("Pragma: cache");
    header('Cache-Control: max-age=' . $timeToLive);
    header('Last-Modified: '. gmdate('D, d M Y H:i:s \G\M\T', time()));
    header('Expires: '. gmdate('D, d M Y H:i:s \G\M\T', time() + $timeToLive));

    //Forward HTTP body
    $resource = $filesystem->readStream($path);
    ob_end_flush();
    fpassthru($resource);
    exit(0);
}

catch (Exception $e) {
    $filePath = ArrayUtils::get($settings, 'proxy_downloads_not_found_location');
    if (is_string($filePath) && !empty($filePath) && $filePath[0] !== '/') {
        $filePath = $basePath . '/' . $filePath;
    }

    // TODO: Throw message if the error is a invalid configuration
    if (file_exists($filePath)) {
        $mime = mime_content_type($filePath);

        // TODO: Do we need to cache non-existing files?
        if ($mime) {
            header('Content-type: ' . $mime);
        }
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
