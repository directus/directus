<?php

namespace Directus\Api\Routes;

use Directus\Application\Route;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Services\AssetService;
use Slim\Http\Stream;
use function Directus\get_directus_setting;

class Assets extends Route
{
    public function __invoke(Request $request, Response $response)
    {
        $service = new AssetService($this->container);
        $fileId = $request->getAttribute('id');

        $asset = $service->getAsset(
            $fileId,
            $request->getQueryParams(),
            true
        );

        if (isset($asset['file']) && $asset['mimeType']) {
            $response->setHeader('Content-type', $asset['mimeType']);
            $response->setHeader('Content-Disposition', 'filename="' . $asset['filename_download'] . '"');
            $response->setHeader('Last-Modified', $asset['last_modified']);

            $ttl = get_directus_setting('thumbnail_cache_ttl');

            if ($ttl) {
                $response->setHeader('Cache-Control', 'max-age=' . $ttl . ', public');
            }

            return $response->withBody(new Stream($asset['file']));
        } else {
            return $response->withStatus(404);
        }
    }
}
