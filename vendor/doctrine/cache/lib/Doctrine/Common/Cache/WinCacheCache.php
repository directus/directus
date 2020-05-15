<?php

namespace Doctrine\Common\Cache;

use function count;
use function is_array;
use function wincache_ucache_clear;
use function wincache_ucache_delete;
use function wincache_ucache_exists;
use function wincache_ucache_get;
use function wincache_ucache_info;
use function wincache_ucache_meminfo;
use function wincache_ucache_set;

/**
 * WinCache cache provider.
 *
 * @link   www.doctrine-project.org
 */
class WinCacheCache extends CacheProvider
{
    /**
     * {@inheritdoc}
     */
    protected function doFetch($id)
    {
        return wincache_ucache_get($id);
    }

    /**
     * {@inheritdoc}
     */
    protected function doContains($id)
    {
        return wincache_ucache_exists($id);
    }

    /**
     * {@inheritdoc}
     */
    protected function doSave($id, $data, $lifeTime = 0)
    {
        return wincache_ucache_set($id, $data, $lifeTime);
    }

    /**
     * {@inheritdoc}
     */
    protected function doDelete($id)
    {
        return wincache_ucache_delete($id);
    }

    /**
     * {@inheritdoc}
     */
    protected function doFlush()
    {
        return wincache_ucache_clear();
    }

    /**
     * {@inheritdoc}
     */
    protected function doFetchMultiple(array $keys)
    {
        return wincache_ucache_get($keys);
    }

    /**
     * {@inheritdoc}
     */
    protected function doSaveMultiple(array $keysAndValues, $lifetime = 0)
    {
        $result = wincache_ucache_set($keysAndValues, null, $lifetime);

        return empty($result);
    }

    /**
     * {@inheritdoc}
     */
    protected function doDeleteMultiple(array $keys)
    {
        $result = wincache_ucache_delete($keys);

        return is_array($result) && count($result) !== count($keys);
    }

    /**
     * {@inheritdoc}
     */
    protected function doGetStats()
    {
        $info    = wincache_ucache_info();
        $meminfo = wincache_ucache_meminfo();

        return [
            Cache::STATS_HITS             => $info['total_hit_count'],
            Cache::STATS_MISSES           => $info['total_miss_count'],
            Cache::STATS_UPTIME           => $info['total_cache_uptime'],
            Cache::STATS_MEMORY_USAGE     => $meminfo['memory_total'],
            Cache::STATS_MEMORY_AVAILABLE => $meminfo['memory_free'],
        ];
    }
}
