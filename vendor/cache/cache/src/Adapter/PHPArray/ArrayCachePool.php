<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\PHPArray;

use Cache\Adapter\Common\AbstractCachePool;
use Cache\Adapter\Common\CacheItem;
use Cache\Adapter\Common\PhpCacheItem;
use Cache\Hierarchy\HierarchicalCachePoolTrait;
use Cache\Hierarchy\HierarchicalPoolInterface;

/**
 * Array cache pool. You could set a limit of how many items you want to be stored to avoid memory leaks.
 *
 * @author Tobias Nyholm <tobias.nyholm@gmail.com>
 */
class ArrayCachePool extends AbstractCachePool implements HierarchicalPoolInterface
{
    use HierarchicalCachePoolTrait;

    /**
     * @type PhpCacheItem[]
     */
    private $cache;

    /**
     * @type array
     *             A map to hold keys
     */
    private $keyMap = [];

    /**
     * @type int
     *           The maximum number of keys in the map
     */
    private $limit;

    /**
     * @type int
     *           The next key that we should remove from the cache
     */
    private $currentPosition = 0;

    /**
     * @param int   $limit the amount if items stored in the cache. Using a limit will reduce memory leaks.
     * @param array $cache
     */
    public function __construct($limit = null, array &$cache = [])
    {
        $this->cache = &$cache;
        $this->limit = $limit;
    }

    /**
     * {@inheritdoc}
     */
    protected function getItemWithoutGenerateCacheKey($key)
    {
        if (isset($this->deferred[$key])) {
            /** @type CacheItem $item */
            $item = clone $this->deferred[$key];
            $item->moveTagsToPrevious();

            return $item;
        }

        return $this->fetchObjectFromCache($key);
    }

    /**
     * {@inheritdoc}
     */
    protected function fetchObjectFromCache($key)
    {
        $keyString = $this->getHierarchyKey($key);
        if (!isset($this->cache[$keyString])) {
            return [false, null, [], null];
        }

        list($data, $tags, $timestamp) = $this->cache[$keyString];

        if (is_object($data)) {
            $data = clone $data;
        }

        return [true, $data, $tags, $timestamp];
    }

    /**
     * {@inheritdoc}
     */
    protected function clearAllObjectsFromCache()
    {
        $this->cache = [];

        return true;
    }

    /**
     * {@inheritdoc}
     */
    protected function clearOneObjectFromCache($key)
    {
        $this->commit();
        $path      = null;
        $keyString = $this->getHierarchyKey($key, $path);
        if (isset($this->cache[$path])) {
            $this->cache[$path]++;
        } else {
            $this->cache[$path] = 0;
        }
        $this->clearHierarchyKeyCache();

        unset($this->cache[$keyString]);

        return true;
    }

    /**
     * {@inheritdoc}
     */
    protected function storeItemInCache(PhpCacheItem $item, $ttl)
    {
        $key               = $this->getHierarchyKey($item->getKey());
        $value             = $item->get();
        if (is_object($value)) {
            $value = clone $value;
        }
        $this->cache[$key] = [$value, $item->getTags(), $item->getExpirationTimestamp()];

        if ($this->limit !== null) {
            // Remove the oldest value
            if (isset($this->keyMap[$this->currentPosition])) {
                unset($this->cache[$this->keyMap[$this->currentPosition]]);
            }

            // Add the new key to the current position
            $this->keyMap[$this->currentPosition] = $key;

            // Increase the current position
            $this->currentPosition = ($this->currentPosition + 1) % $this->limit;
        }

        return true;
    }

    /**
     * {@inheritdoc}
     */
    protected function getDirectValue($key)
    {
        if (isset($this->cache[$key])) {
            return $this->cache[$key];
        }
    }

    /**
     * {@inheritdoc}
     */
    protected function getList($name)
    {
        if (!isset($this->cache[$name])) {
            $this->cache[$name] = [];
        }

        return $this->cache[$name];
    }

    /**
     * {@inheritdoc}
     */
    protected function removeList($name)
    {
        unset($this->cache[$name]);

        return true;
    }

    /**
     * {@inheritdoc}
     */
    protected function appendListItem($name, $key)
    {
        $this->cache[$name][] = $key;
    }

    /**
     * {@inheritdoc}
     */
    protected function removeListItem($name, $key)
    {
        foreach ($this->cache[$name] as $i => $item) {
            if ($item === $key) {
                unset($this->cache[$name][$i]);
            }
        }
    }
}
