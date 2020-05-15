<?php

namespace Directus\Application\Http\Middleware;

use Directus\Application\Http\Request;
use Directus\Application\Http\Response;

class AuthenticationOptionalMiddleware extends AbstractMiddleware
{
    public function __invoke(Request $request, Response $response, callable $next)
    {
        // "auth_optional" will ignore failed authentication
        // it will keep moving through the middleware stack
        $request = $request->withAttribute('auth_optional', true);

        return $next($request, $response);
    }
}
