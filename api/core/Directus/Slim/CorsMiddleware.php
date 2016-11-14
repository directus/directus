<?php

namespace Directus\Slim;

use Directus\Util\ArrayUtils;
use Slim\Middleware;

class CorsMiddleware extends Middleware
{
    public function call()
    {
        $corsOptions = ArrayUtils::get($this->app->container->get('config'), 'cors');
        if (ArrayUtils::get($corsOptions, 'enabled', false)) {
            $response = $this->app->response();
            $response->header('Access-Control-Allow-Origin', ArrayUtils::get($corsOptions, 'origin', '*'));
            foreach (ArrayUtils::get($corsOptions, 'headers', []) as list($headerType, $headerValue)) {
                $response->header($headerType, $headerValue);
            }
        }

        if (!$this->app->request()->isOptions()) {
            $this->next->call();
        }
    }
}