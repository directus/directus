<?php

namespace Directus\Api\Routes;

use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Application\Route;
use Directus\Services\ServerService;

class Home extends Route
{
    public function __invoke(Request $request, Response $response)
    {
        $service = new ServerService($this->container);
        $responseData = $service->findAllInfo();

        return $this->responseWithData($request, $response, $responseData);
    }
}
