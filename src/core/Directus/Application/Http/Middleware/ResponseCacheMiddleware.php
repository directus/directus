<?php

namespace Directus\Application\Http\Middleware;

use Directus\Cache\Response as CacheResponse;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Util\StringUtils;

class ResponseCacheMiddleware extends AbstractMiddleware
{
    /**
     * @param Request $request
     * @param Response $response
     * @param callable $next
     *
     * @return $this|Response
     */
    public function __invoke(Request $request, Response $response, callable $next)
    {
        $container = $this->container;
        $forceRefresh = false;

        /** @var CacheResponse $cache */
        $cache = $this->container->get('response_cache');

        if ($request->isGet()) {
            $parameters = $request->getQueryParams();
            ksort($parameters);

            $forceRefresh = (empty($parameters['refresh_cache'])) ? false : true;
            unset($parameters['refresh_cache']);

            $requestPath = $request->getUri()->getPath();

            $key = md5($container->get('acl')->getUserId().'@'.$requestPath.'?'.http_build_query($parameters));
        } else if ($request->isPost() && StringUtils::endsWith($request->getUri()->getPath(), '/gql')) {
            // Handle caching for GraphQL query that are POST.
            // TODO:: Add support for ACL and Mutation
            $body = $request->getBody();
            $key = md5($body->getContents());
            $body->rewind();
        } else {
            $key = null;
        }

        $config = $container->get('config');
        if ($config->get('cache.enabled') && $key && !$forceRefresh && $cachedResponse = $cache->get($key)) {
            $body = new \Slim\Http\Body(fopen('php://temp', 'r+'));
            $body->write($cachedResponse['body']);
            $response = $response->withBody($body)->withHeaders($cachedResponse['headers']);
        } else {
            /** @var Response $response */
            $response = $next($request, $response);

            $body = $response->getBody();
            $body->rewind();
            $bodyContent = $body->getContents();
            $headers = $response->getHeaders();

            $cache->process($key, $bodyContent, $headers);
        }

        return $response;
    }
}
