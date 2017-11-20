<?php

namespace Directus\Slim;

use Directus\Bootstrap;
use Directus\Cache\Response;
use Slim\Middleware;

class ResponseCacheMiddleware extends Middleware
{
    public function call()
    {
        $container = $this->app->container;
        $forceRefresh = false;

        /** @var Response $cache */
        $cache = $this->app->container->get('responseCache');

        if($this->app->request->isGet()) {
            $parameters = $this->app->request()->get();
            ksort($parameters);

            $forceRefresh = (empty($parameters['refresh_cache'])) ? false : true;
            unset($parameters['refresh_cache']);

            $key = md5($container->get('acl')->getUserId().'@'.$this->app->request->getResourceUri().'?'.http_build_query($parameters));
        } else {
            $key = null;
        }

        $config = $container->get('config');
        if($config->get('cache.enabled') && $key && !$forceRefresh && $cachedResponse = $cache->get($key)) {
            $response = $this->app->response();
            $response->setBody($cachedResponse->getBody());
            $response->headers = $cachedResponse->headers;
        } else {
            $this->next->call();

            $response = $this->app->response();
            $cache->process($key, $response);
        }
    }
}
