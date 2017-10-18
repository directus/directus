<?php

namespace Directus\Slim;

use Slim\Middleware;

class HttpCacheMiddleware extends Middleware
{
    public function call()
    {
        // NOTE: This is a hotfix to prevent ALL get param from being cached
        // This will be temporary until we implement our final cache layer/solution
        if ($this->app->request()->isGet()) {
            $response = $this->app->response();
            $response->header('Cache-Control', 'no-store,no-cache,must-revalidate');
        }

        $this->next->call();
    }
}
