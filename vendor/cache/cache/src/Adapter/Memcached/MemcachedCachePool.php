<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\Memcached;

use Cache\Adapter\Common\AbstractCachePool;
use Cache\Adapter\Common\PhpCacheItem;
use Cache\Adapter\Common\TagSupportWithArray;
use Cache\Hierarchy\HierarchicalCachePoolTrait;
use Cache\Hierarchy\HierarchicalPoolInterface;

/**
 * @author Aaron Scherer <aequasi@gmail.com>
 * @author Tobias Nyholm <tobias.nyholm@gmail.com>
 */
class MemcachedCachePool extends AbstractCachePool implements HierarchicalPoolInterface
{
    use HierarchicalCachePoolTrait;
    use TagSupportWithArray;

    /**
     * @type \Memcached
     */
    protected $cache;

    /**
     * @param \Memcached $cache
     */
    public function __construct(\Memcached $cache)
    {
        $this->cache = $cache;
        $this->cache->setOption(\Memcached::OPT_BINARY_PROTOCOL, true);
    }

    /**
     * {@inheritdoc}
     */
    protected function fetchObjectFromCache($key)
    {
        if (false === $result = unserialize($this->cache->get($this->getHierarchyKey($key)))) {
            return [false, null, [], null];
        }

        return $result;
    }

    /**
     * {@inheritdoc}
     */
    protected function clearAllObjectsFromCache()
    {
        return $this->cache->flush();
    }

    /**
     * {@inheritdoc}
     */
    protected function clearOneObjectFromCache($key)
    {
        $this->commit();
        $path = null;
        $key  = $this->getHierarchyKey($key, $path);
        if ($path) {
            $this->cache->increment($path, 1, 0);
        }
        $this->clearHierarchyKeyCache();

        if ($this->cache->delete($key)) {
            return true;
        }

        // Return true if key not found
        return $this->cache->getResultCode() === \Memcached::RES_NOTFOUND;
    }

    /**
     * {@inheritdoc}
     */
    protected function storeItemInCache(PhpCacheItem $item, $ttl)
    {
        if ($ttl === null) {
            $ttl = 0;
        } elseif ($ttl < 0) {
            return false;
        } elseif ($ttl > 86400 * 30) {
            // Any time higher than 30 days is interpreted as a unix timestamp date.
            // https://github.com/memcached/memcached/wiki/Programming#expiration
            $ttl = time() + $ttl;
        }

        $key = $this->getHierarchyKey($item->getKey());

        return $this->cache->set($key, serialize([true, $item->get(), $item->getTags(), $item->getExpirationTimestamp()]), $ttl);
    }

    /**
     * {@inheritdoc}
     */
    public function getDirectValue($name)
    {
        return $this->cache->get($name);
    }

    /**
     * {@inheritdoc}
     */
    public function setDirectValue($name, $value)
    {
        $this->cache->set($name, $value);
    }
}
