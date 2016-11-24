<?php

namespace Directus\Services;

use Directus\Application\Application;

// @note: this is a temporary solution to implement services into Directus
abstract class AbstractService
{
    protected $app;

    public function __construct(Application $app)
    {
        $this->app = $app;
    }
}