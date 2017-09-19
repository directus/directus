<?php

namespace Directus\Slim;

use Directus\Bootstrap;
use Directus\Cache\Response;
use Slim\Middleware;

class ResponseCacheMiddleware extends Middleware
{
    public function call()
    {
        /** @var Response $cache */
        $cache = $this->app->container->get('responseCache');

        if($this->app->request->isGet()) {
            $parameters = $this->app->request()->get();
            ksort($parameters);

            $key = md5($this->app->request->getResourceUri().'?'.http_build_query($parameters));
        } else {
            $key = null;
        }

        if($key && $cachedResponse = $cache->get($key)) {
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
