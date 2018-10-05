<?php

namespace Directus\Application\Http\Middleware;

use Directus\Application\Http\Request;
use Directus\Application\Http\Response;

class AuthenticationIgnoreOriginMiddleware extends AbstractMiddleware
{
    public function __invoke(Request $request, Response $response, callable $next)
    {
        // "ignore_origin" will skip the validation of the origin of the token
        // it won't check if the token match the project name or auth public key
        // checking for origin only works for project endpoints to separate users for interacting with other project
        // using the same token
        // all other endpoints (global endpoints) should be shared across all projects
        // all projects' users should be able to fetch the extensions information
        $request = $request->withAttribute('ignore_origin', true);
        return $next($request, $response);
    }
}
