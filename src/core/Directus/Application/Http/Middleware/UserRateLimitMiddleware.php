<?php

namespace Directus\Application\Http\Middleware;

use Directus\Application\Http\Middleware\RateLimit\UserIdentityResolver;

class UserRateLimitMiddleware extends AbstractRateLimitMiddleware
{
    public function getIdentityResolver()
    {
        return new UserIdentityResolver($this->container->get('acl'));
    }
}
