<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Prefixed;

use Psr\SimpleCache\CacheInterface;

/**
 * PrefixedSimpleCache.
 *
 * Prefixes all cache keys with a string.
 *
 * @author ndobromirov
 */
class PrefixedSimpleCache implements CacheInterface
{
    use PrefixedUtilityTrait;

    /**
     * @type CacheInterface
     */
    private $cache;

    /**
     * @param CacheInterface $simpleCache
     * @param string         $prefix
     */
    public function __construct(CacheInterface $simpleCache, $prefix)
    {
        $this->cache  = $simpleCache;
        $this->prefix = $prefix;
    }

    /**
     * {@inheritdoc}
     */
    public function clear()
    {
        return $this->cache->clear();
    }

    /**
     * {@inheritdoc}
     */
    public function delete($key)
    {
        $this->prefixValue($key);

        return $this->cache->delete($key);
    }

    /**
     * {@inheritdoc}
     */
    public function deleteMultiple($keys)
    {
        $this->prefixValues($keys);

        return $this->cache->deleteMultiple($keys);
    }

    /**
     * {@inheritdoc}
     */
    public function get($key, $default = null)
    {
        $this->prefixValue($key);

        return $this->cache->get($key, $default);
    }

    /**
     * {@inheritdoc}
     */
    public function getMultiple($keys, $default = null)
    {
        $oldKeys = $keys;
        $this->prefixValues($keys);
        $keysMap = array_combine($keys, $oldKeys);

        $data = $this->cache->getMultiple($keys, $default);

        // As ordering is configuration dependent, remap the results.
        $result = [];
        foreach ($data as $key => $value) {
            $result[$keysMap[$key]] = $value;
        }

        return $result;
    }

    /**
     * {@inheritdoc}
     */
    public function has($key)
    {
        $this->prefixValue($key);

        return $this->cache->has($key);
    }

    /**
     * {@inheritdoc}
     */
    public function set($key, $value, $ttl = null)
    {
        $this->prefixValue($key);

        return $this->cache->set($key, $value, $ttl);
    }

    /**
     * {@inheritdoc}
     */
    public function setMultiple($values, $ttl = null)
    {
        $keys = array_keys($values);
        $this->prefixValues($keys);

        $values = array_combine($keys, array_values($values));

        return $this->cache->setMultiple($values, $ttl);
    }
}
