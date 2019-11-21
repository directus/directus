<?php

namespace Doctrine\Common\Cache;

use Redis;
use function array_combine;
use function array_diff_key;
use function array_fill_keys;
use function array_filter;
use function array_keys;
use function count;
use function defined;
use function extension_loaded;
use function is_bool;

/**
 * Redis cache provider.
 *
 * @link   www.doctrine-project.org
 */
class RedisCache extends CacheProvider
{
    /** @var Redis|null */
    private $redis;

    /**
     * Sets the redis instance to use.
     *
     * @return void
     */
    public function setRedis(Redis $redis)
    {
        $redis->setOption(Redis::OPT_SERIALIZER, $this->getSerializerValue());
        $this->redis = $redis;
    }

    /**
     * Gets the redis instance used by the cache.
     *
     * @return Redis|null
     */
    public function getRedis()
    {
        return $this->redis;
    }

    /**
     * {@inheritdoc}
     */
    protected function doFetch($id)
    {
        return $this->redis->get($id);
    }

    /**
     * {@inheritdoc}
     */
    protected function doFetchMultiple(array $keys)
    {
        $fetchedItems = array_combine($keys, $this->redis->mget($keys));

        // Redis mget returns false for keys that do not exist. So we need to filter those out unless it's the real data.
        $keysToFilter = array_keys(array_filter($fetchedItems, static function ($item) : bool {
            return $item === false;
        }));

        if ($keysToFilter) {
            $multi = $this->redis->multi(Redis::PIPELINE);
            foreach ($keysToFilter as $key) {
                $multi->exists($key);
            }
            $existItems     = array_filter($multi->exec());
            $missedItemKeys = array_diff_key($keysToFilter, $existItems);
            $fetchedItems   = array_diff_key($fetchedItems, array_fill_keys($missedItemKeys, true));
        }

        return $fetchedItems;
    }

    /**
     * {@inheritdoc}
     */
    protected function doSaveMultiple(array $keysAndValues, $lifetime = 0)
    {
        if ($lifetime) {
            // Keys have lifetime, use SETEX for each of them
            $multi = $this->redis->multi(Redis::PIPELINE);
            foreach ($keysAndValues as $key => $value) {
                $multi->setex($key, $lifetime, $value);
            }
            $succeeded = array_filter($multi->exec());

            return count($succeeded) == count($keysAndValues);
        }

        // No lifetime, use MSET
        return (bool) $this->redis->mset($keysAndValues);
    }

    /**
     * {@inheritdoc}
     */
    protected function doContains($id)
    {
        $exists = $this->redis->exists($id);

        if (is_bool($exists)) {
            return $exists;
        }

        return $exists > 0;
    }

    /**
     * {@inheritdoc}
     */
    protected function doSave($id, $data, $lifeTime = 0)
    {
        if ($lifeTime > 0) {
            return $this->redis->setex($id, $lifeTime, $data);
        }

        return $this->redis->set($id, $data);
    }

    /**
     * {@inheritdoc}
     */
    protected function doDelete($id)
    {
        return $this->redis->del($id) >= 0;
    }

    /**
     * {@inheritdoc}
     */
    protected function doDeleteMultiple(array $keys)
    {
        return $this->redis->del($keys) >= 0;
    }

    /**
     * {@inheritdoc}
     */
    protected function doFlush()
    {
        return $this->redis->flushDB();
    }

    /**
     * {@inheritdoc}
     */
    protected function doGetStats()
    {
        $info = $this->redis->info();

        return [
            Cache::STATS_HITS   => $info['keyspace_hits'],
            Cache::STATS_MISSES => $info['keyspace_misses'],
            Cache::STATS_UPTIME => $info['uptime_in_seconds'],
            Cache::STATS_MEMORY_USAGE      => $info['used_memory'],
            Cache::STATS_MEMORY_AVAILABLE  => false,
        ];
    }

    /**
     * Returns the serializer constant to use. If Redis is compiled with
     * igbinary support, that is used. Otherwise the default PHP serializer is
     * used.
     *
     * @return int One of the Redis::SERIALIZER_* constants
     */
    protected function getSerializerValue()
    {
        if (defined('Redis::SERIALIZER_IGBINARY') && extension_loaded('igbinary')) {
            return Redis::SERIALIZER_IGBINARY;
        }

        return Redis::SERIALIZER_PHP;
    }
}
