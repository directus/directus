<?php

namespace Directus\Cache;

use Cache\TagInterop\TaggableCacheItemInterface;
use Cache\TagInterop\TaggableCacheItemPoolInterface;

class Cache
{
    protected $pool;
    public $ttl = null;

    public function __construct(TaggableCacheItemPoolInterface $pool, $defaultTtl = null)
    {
        $this->pool = $pool;
        $this->ttl = $defaultTtl;

    }

    public function getPool()
    {
        return $this->pool;
    }

    /**
     * @param $key
     * @param null $value
     * @return TaggableCacheItemInterface
     */
    public function set($key, $value = null)
    {
        $item = $this->getPool()->getItem($key)->set($value);
        $this->getPool()->save($item);

        return $item;
    }

    public function get($key)
    {
        return $this->getPool()->getItem($key)->get();
    }
}