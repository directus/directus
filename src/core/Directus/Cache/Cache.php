<?php

namespace Directus\Cache;

use Cache\TagInterop\TaggableCacheItemInterface;
use Cache\TagInterop\TaggableCacheItemPoolInterface;

class Cache
{
    protected $pool;
    public $defaultTtl = null;

    public function __construct(TaggableCacheItemPoolInterface $pool, $defaultTtl = null)
    {
        $this->pool = $pool;
        $this->defaultTtl = $defaultTtl;

    }

    public function getPool()
    {
        return $this->pool;
    }

    /**
     * @param $key
     * @param bool $value
     * @param array $tags
     * @param int $ttl
     * @return TaggableCacheItemInterface
     */
    public function set($key, $value = null, $tags = [], $ttl = null)
    {
        $ttl = ($ttl) ? $ttl : $this->defaultTtl;

        $item = $this->getPool()->getItem($key)->set($value);

        if($tags) {
            $item->setTags($tags);
        }

        if($ttl) {
            $item->expiresAfter($ttl);
        }

        $this->getPool()->save($item);

        return $item;
    }

    public function get($key)
    {
        return $this->getPool()->getItem($key)->get();
    }
}