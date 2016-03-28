<?php

namespace Directus\Cache;

use Directus\Bootstrap;

class CacheServiceProvider
{
    /**
     * Config array
     *
     * @var array
     */
    protected $config = [];

    public function __construct()
    {
        $config = Bootstrap::get('config');
        $this->config = array_key_exists('cache', $config) ? $config['cache'] : [];
    }

    public function boot($app)
    {
        if (!$this->config) {
            return $this->createDefaultRepository();
        }

        return $cache;
    }

    protected function createDefaultRepository()
    {
        $storage = new \RNGR\Cache\ArrayStorage();
        $cache = new \RNGR\Cache\Repository($storage);
    }
}
