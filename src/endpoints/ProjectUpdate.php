<?php

namespace Directus\Api\Routes;

use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Application\Route;
use function Directus\get_api_project_from_request;
use Directus\Util\Installation\InstallerUtils;

class ProjectUpdate extends Route
{
    public function __invoke(Request $request, Response $response)
    {
        InstallerUtils::updateTables($this->container->get('path_base'), get_api_project_from_request());

        return $this->responseWithData($request, $response, []);
    }
}
