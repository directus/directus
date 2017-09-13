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
        $cache = Bootstrap::get('responseCache');

        if($_SERVER['REQUEST_METHOD'] == 'GET') {
            $path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);

            $parameters = $_GET;
            ksort($parameters);

            $key = md5($path.'?'.http_build_query($parameters));
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
