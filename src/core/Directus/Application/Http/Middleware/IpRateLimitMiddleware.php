<?php

namespace Directus\Application\Http\Middleware;

use RateLimit\Middleware\Identity\IpAddressIdentityResolver;

class IpRateLimitMiddleware extends AbstractRateLimitMiddleware
{
    /**
     * @inheritdoc
     */
    protected function getIdentityResolver()
    {
        return new IpAddressIdentityResolver();
    }
}
