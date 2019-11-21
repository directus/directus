<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\Redis;

use Cache\Adapter\Common\AbstractCachePool;
use Cache\Adapter\Common\Exception\CachePoolException;
use Cache\Adapter\Common\PhpCacheItem;
use Cache\Hierarchy\HierarchicalCachePoolTrait;
use Cache\Hierarchy\HierarchicalPoolInterface;

/**
 * @author Tobias Nyholm <tobias.nyholm@gmail.com>
 */
class RedisCachePool extends AbstractCachePool implements HierarchicalPoolInterface
{
    use HierarchicalCachePoolTrait;

    /**
     * @type \Redis
     */
    protected $cache;

    /**
     * @param \Redis|\RedisArray|\RedisCluster $cache
     */
    public function __construct($cache)
    {
        if (!$cache instanceof \Redis
            && !$cache instanceof \RedisArray
            && !$cache instanceof \RedisCluster
        ) {
            throw new CachePoolException(
                'Cache instance must be of type \Redis, \RedisArray, or \RedisCluster'
            );
        }

        $this->cache = $cache;
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
        if ($this->cache instanceof \RedisCluster) {
            return $this->clearAllObjectsFromCacheCluster();
        }

        $result = $this->cache->flushDb();

        if (!is_array($result)) {
            return $result;
        }

        $success = true;

        foreach ($result as $serverResult) {
            if (!$serverResult) {
                $success = false;
                break;
            }
        }

        return $success;
    }

    /**
     * Clear all objects from all nodes in the cluster.
     *
     * @return bool false if error
     */
    protected function clearAllObjectsFromCacheCluster()
    {
        $nodes = $this->cache->_masters();

        foreach ($nodes as $node) {
            if (!$this->cache->flushDB($node)) {
                return false;
            }
        }

        return true;
    }

    /**
     * {@inheritdoc}
     */
    protected function clearOneObjectFromCache($key)
    {
        $path      = null;
        $keyString = $this->getHierarchyKey($key, $path);
        if ($path) {
            $this->cache->incr($path);
        }
        $this->clearHierarchyKeyCache();

        return $this->cache->del($keyString) >= 0;
    }

    /**
     * {@inheritdoc}
     */
    protected function storeItemInCache(PhpCacheItem $item, $ttl)
    {
        $key  = $this->getHierarchyKey($item->getKey());
        $data = serialize([true, $item->get(), $item->getTags(), $item->getExpirationTimestamp()]);
        if ($ttl === null || $ttl === 0) {
            return $this->cache->set($key, $data);
        }

        return $this->cache->setex($key, $ttl, $data);
    }

    /**
     * {@inheritdoc}
     */
    protected function getDirectValue($key)
    {
        return $this->cache->get($key);
    }

    /**
     * {@inheritdoc}
     */
    protected function appendListItem($name, $value)
    {
        $this->cache->lPush($name, $value);
    }

    /**
     * {@inheritdoc}
     */
    protected function getList($name)
    {
        return $this->cache->lRange($name, 0, -1);
    }

    /**
     * {@inheritdoc}
     */
    protected function removeList($name)
    {
        return $this->cache->del($name);
    }

    /**
     * {@inheritdoc}
     */
    protected function removeListItem($name, $key)
    {
        return $this->cache->lrem($name, $key, 0);
    }
}
