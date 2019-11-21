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
     * @type array A map to hold keys
     */
    private $keyMap = [];

    /**
     * @type int The maximum number of keys in the map
     */
    private $limit;

    /**
     * @type int The next key that we should remove from the cache
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
        $keys = $this->getHierarchyKey($key);

        if (!$this->cacheIsset($keys)) {
            return [false, null, [], null];
        }

        $element                       = $this->cacheToolkit($keys);
        list($data, $tags, $timestamp) = $element;

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
        $keys = $this->getHierarchyKey($key);

        $this->clearHierarchyKeyCache();
        $this->cacheToolkit($keys, null, true);

        return true;
    }

    /**
     * {@inheritdoc}
     */
    protected function storeItemInCache(PhpCacheItem $item, $ttl)
    {
        $keys   = $this->getHierarchyKey($item->getKey());
        $value  = $item->get();
        if (is_object($value)) {
            $value = clone $value;
        }
        $this->cacheToolkit($keys, [$value, $item->getTags(), $item->getExpirationTimestamp()]);

        if ($this->limit !== null) {
            // Remove the oldest value
            if (isset($this->keyMap[$this->currentPosition])) {
                unset($this->cache[$this->keyMap[$this->currentPosition]]);
            }

            // Add the new key to the current position
            $this->keyMap[$this->currentPosition] = implode(HierarchicalPoolInterface::HIERARCHY_SEPARATOR, $keys);

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
        if (isset($this->cache[$name])) {
            foreach ($this->cache[$name] as $i => $item) {
                if ($item === $key) {
                    unset($this->cache[$name][$i]);
                }
            }
        }
    }

    /**
     * Used to manipulate cached data by extracting, inserting or deleting value.
     *
     * @param array      $keys
     * @param null|mixed $value
     * @param bool       $unset
     *
     * @return mixed
     */
    private function cacheToolkit($keys, $value = null, $unset = false)
    {
        $element = &$this->cache;

        while ($keys && ($key = array_shift($keys))) {
            if (!$keys && is_null($value) && $unset) {
                unset($element[$key]);
                unset($element);
                $element = null;
            } else {
                $element =&$element[$key];
            }
        }

        if (!$unset && !is_null($value)) {
            $element = $value;
        }

        return $element;
    }

    /**
     * Checking if given keys exists and is valid.
     *
     * @param array $keys
     *
     * @return bool
     */
    private function cacheIsset($keys)
    {
        $has   = false;
        $array = $this->cache;

        foreach ($keys as $key) {
            if ($has = array_key_exists($key, $array)) {
                $array = $array[$key];
            }
        }

        if (is_array($array)) {
            $has = $has && array_key_exists(0, $array);
        }

        return $has;
    }

    /**
     * Get a key to use with the hierarchy. If the key does not start with HierarchicalPoolInterface::SEPARATOR
     * this will return an unalterered key. This function supports a tagged key. Ie "foo:bar".
     * With this overwrite we'll return array as keys.
     *
     * @param string $key The original key
     *
     * @return array
     */
    protected function getHierarchyKey($key)
    {
        if (!$this->isHierarchyKey($key)) {
            return [$key];
        }

        return $this->explodeKey($key);
    }
}
