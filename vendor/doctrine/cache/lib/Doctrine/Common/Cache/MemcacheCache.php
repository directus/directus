<?php

namespace Doctrine\Common\Cache;

use Memcache;
use function time;

/**
 * Memcache cache provider.
 *
 * @link   www.doctrine-project.org
 *
 * @deprecated
 */
class MemcacheCache extends CacheProvider
{
    /** @var Memcache|null */
    private $memcache;

    /**
     * Sets the memcache instance to use.
     *
     * @return void
     */
    public function setMemcache(Memcache $memcache)
    {
        $this->memcache = $memcache;
    }

    /**
     * Gets the memcache instance used by the cache.
     *
     * @return Memcache|null
     */
    public function getMemcache()
    {
        return $this->memcache;
    }

    /**
     * {@inheritdoc}
     */
    protected function doFetch($id)
    {
        return $this->memcache->get($id);
    }

    /**
     * {@inheritdoc}
     */
    protected function doContains($id)
    {
        $flags = null;
        $this->memcache->get($id, $flags);

        //if memcache has changed the value of "flags", it means the value exists
        return $flags !== null;
    }

    /**
     * {@inheritdoc}
     */
    protected function doSave($id, $data, $lifeTime = 0)
    {
        if ($lifeTime > 30 * 24 * 3600) {
            $lifeTime = time() + $lifeTime;
        }
        return $this->memcache->set($id, $data, 0, (int) $lifeTime);
    }

    /**
     * {@inheritdoc}
     */
    protected function doDelete($id)
    {
        // Memcache::delete() returns false if entry does not exist
        return $this->memcache->delete($id) || ! $this->doContains($id);
    }

    /**
     * {@inheritdoc}
     */
    protected function doFlush()
    {
        return $this->memcache->flush();
    }

    /**
     * {@inheritdoc}
     */
    protected function doGetStats()
    {
        $stats = $this->memcache->getStats();
        return [
            Cache::STATS_HITS   => $stats['get_hits'],
            Cache::STATS_MISSES => $stats['get_misses'],
            Cache::STATS_UPTIME => $stats['uptime'],
            Cache::STATS_MEMORY_USAGE     => $stats['bytes'],
            Cache::STATS_MEMORY_AVAILABLE => $stats['limit_maxbytes'],
        ];
    }
}
