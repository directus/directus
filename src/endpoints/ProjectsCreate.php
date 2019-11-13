<?php

namespace Directus\Api\Routes;

use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Application\Route;
use Directus\Services\ProjectService;
use Directus\Util\Installation\InstallerUtils;

class ProjectsCreate extends Route
{
    public function __invoke(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        $installService = new ProjectService($this->container);
        $installService->create($request->getParsedBody());
        InstallerUtils::addUpgradeMigrations();
        return $this->responseWithData($request, $response, []);
    }
}
