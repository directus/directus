<?php

namespace Directus\Services;

use Directus\Application\Application;

abstract class AbstractService
{
    protected $app;

    public function __construct(Application $app)
    {
        $this->app = $app;
    }
}