<?php

namespace Directus\Application;

use Directus\Bootstrap;

abstract class Route
{
    /**
     * @var \Slim\Slim
     */
    protected $app;

    public function __construct(Application $app)
    {
        $this->app = $app;
    }

    public function setTags($tags)
    {
        Bootstrap::get('responseCache')->setTags($tags);
    }

    public function invalidateTags($tags)
    {
        Bootstrap::get('responseCache')->invalidateTags($tags);
    }

}