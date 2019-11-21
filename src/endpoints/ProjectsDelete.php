<?php

namespace Directus\Api\Routes;

use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Application\Route;
use Directus\Services\ProjectService;

class ProjectsDelete extends Route
{
    public function __invoke(Request $request, Response $response)
    {
        $installService = new ProjectService($this->container);
        $installService->delete($request);

        return $this->responseWithData($request, $response, []);
    }
}
