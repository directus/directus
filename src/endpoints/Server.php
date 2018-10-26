<?php

namespace Directus\Api\Routes;

use Directus\Application\Application;
use Directus\Application\Route;

class Server extends Route
{
    /**
     * @param Application $app
     */
    public function __invoke(Application $app)
    {
        \Directus\create_ping_route($app);
    }
}
