<?php

namespace Directus\Application\Http\Middleware;

use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Authentication\Exception\UserNotAuthenticatedException;
use Directus\Permissions\Acl;

class AuthenticatedMiddleware extends AbstractMiddleware
{
    public function __invoke(Request $request, Response $response, callable $next)
    {
        /** @var Acl $acl */
        $acl = $this->container->get('acl');

        if ($request->getAttribute('auth_optional') === true || ($acl->getUserId() && $acl->isPublic() !== true)) {
            return $next($request, $response);
        }

        throw new UserNotAuthenticatedException();
    }
}
