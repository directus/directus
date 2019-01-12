<?php

namespace Directus\Application\Http\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use RKA\Middleware\ProxyDetectionMiddleware;

class ProxyMiddleware extends ProxyDetectionMiddleware
{
    public function __invoke(ServerRequestInterface $request, ResponseInterface $response, $next)
    {
        // Load the settings trusted proxies when the middleware is invoked
        // This solve the issue to catch the database error when it fails
        // Loading this before the app routing is loaded, no json is output as none of the service are loaded yet
        $this->trustedProxies = array_merge($this->trustedProxies, \Directus\get_trusted_proxies());

        return parent::__invoke($request, $response, $next);
    }
}
