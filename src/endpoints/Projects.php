<?php

namespace Directus\Api\Routes;

use Directus\Application\Application;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Application\Route;
use Directus\Services\ProjectService;

class Projects extends Route
{
    public function __invoke(Application $app)
    {
        $app->post('', [$this, 'create']);
    }

    public function create(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        $installService = new ProjectService($this->container);
        $installService->create($request->getParsedBody());

        return $this->responseWithData($request, $response, []);
    }
}
