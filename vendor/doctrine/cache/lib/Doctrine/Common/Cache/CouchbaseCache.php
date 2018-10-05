<?php

namespace Doctrine\Common\Cache;

use Couchbase;
use function explode;
use function time;

/**
 * Couchbase cache provider.
 *
 * @link   www.doctrine-project.org
 * @deprecated Couchbase SDK 1.x is now deprecated. Use \Doctrine\Common\Cache\CouchbaseBucketCache instead.
 * https://developer.couchbase.com/documentation/server/current/sdk/php/compatibility-versions-features.html
 */
class CouchbaseCache extends CacheProvider
{
    /** @var Couchbase|null */
    private $couchbase;

    /**
     * Sets the Couchbase instance to use.
     *
     * @return void
     */
    public function setCouchbase(Couchbase $couchbase)
    {
        $this->couchbase = $couchbase;
    }

    /**
     * Gets the Couchbase instance used by the cache.
     *
     * @return Couchbase|null
     */
    public function getCouchbase()
    {
        return $this->couchbase;
    }

    /**
     * {@inheritdoc}
     */
    protected function doFetch($id)
    {
        return $this->couchbase->get($id) ?: false;
    }

    /**
     * {@inheritdoc}
     */
    protected function doContains($id)
    {
        return $this->couchbase->get($id) !== null;
    }

    /**
     * {@inheritdoc}
     */
    protected function doSave($id, $data, $lifeTime = 0)
    {
        if ($lifeTime > 30 * 24 * 3600) {
            $lifeTime = time() + $lifeTime;
        }
        return $this->couchbase->set($id, $data, (int) $lifeTime);
    }

    /**
     * {@inheritdoc}
     */
    protected function doDelete($id)
    {
        return $this->couchbase->delete($id);
    }

    /**
     * {@inheritdoc}
     */
    protected function doFlush()
    {
        return $this->couchbase->flush();
    }

    /**
     * {@inheritdoc}
     */
    protected function doGetStats()
    {
        $stats   = $this->couchbase->getStats();
        $servers = $this->couchbase->getServers();
        $server  = explode(':', $servers[0]);
        $key     = $server[0] . ':11210';
        $stats   = $stats[$key];
        return [
            Cache::STATS_HITS   => $stats['get_hits'],
            Cache::STATS_MISSES => $stats['get_misses'],
            Cache::STATS_UPTIME => $stats['uptime'],
            Cache::STATS_MEMORY_USAGE     => $stats['bytes'],
            Cache::STATS_MEMORY_AVAILABLE => $stats['limit_maxbytes'],
        ];
    }
}
