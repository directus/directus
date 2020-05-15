<?php

namespace Directus\Application\Http\Middleware;

use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Util\Installation\InstallerUtils;

class DatabaseMigrationMiddleware extends AbstractMiddleware
{
    public function __invoke(Request $request, Response $response, callable $next)
    {
        InstallerUtils::updateTables($this->container->get('path_base'), \Directus\get_api_project_from_request());

        return $next($request, $response);
    }
}
