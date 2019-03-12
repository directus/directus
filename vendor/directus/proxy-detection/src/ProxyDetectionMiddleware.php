<?php
namespace RKA\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class ProxyDetectionMiddleware extends ProxyDetection
{
    /**
     * Override the request URI's scheme, host and port as determined from the proxy headers
     *
     * @param ServerRequestInterface $request PSR7 request
     * @param ResponseInterface $response     PSR7 response
     * @param callable $next                  Next middleware
     *
     * @return ResponseInterface
     */
    public function __invoke(ServerRequestInterface $request, ResponseInterface $response, $next)
    {
        if (!$next) {
            return $response;
        }

        if (!$this->isProxyTrusted($request)) {
            return $response = $next($request, $response);
        }

        $request = $this->processRequest($request);

        return $response = $next($request, $response);
    }
}
