<?php

namespace Doctrine\Tests\Common\Cache;

use Doctrine\Common\Cache\ArrayCache;
use Doctrine\Common\Cache\Cache;

class ArrayCacheTest extends CacheTest
{
    protected function _getCacheDriver()
    {
        return new ArrayCache();
    }

    public function testGetStats()
    {
        $cache = $this->_getCacheDriver();
        $cache->fetch('test1');
        $cache->fetch('test2');
        $cache->fetch('test3');

        $cache->save('test1', 123);
        $cache->save('test2', 123);

        $cache->fetch('test1');
        $cache->fetch('test2');
        $cache->fetch('test3');

        $stats = $cache->getStats();
        $this->assertEquals(2, $stats[Cache::STATS_HITS]);
        $this->assertEquals(5, $stats[Cache::STATS_MISSES]); // +1 for internal call to DoctrineNamespaceCacheKey
        $this->assertNotNull($stats[Cache::STATS_UPTIME]);
        $this->assertNull($stats[Cache::STATS_MEMORY_USAGE]);
        $this->assertNull($stats[Cache::STATS_MEMORY_AVAILABLE]);

        $cache->delete('test1');
        $cache->delete('test2');

        $cache->fetch('test1');
        $cache->fetch('test2');
        $cache->fetch('test3');

        $stats = $cache->getStats();
        $this->assertEquals(2, $stats[Cache::STATS_HITS]);
        $this->assertEquals(8, $stats[Cache::STATS_MISSES]); // +1 for internal call to DoctrineNamespaceCacheKey
    }

    protected function isSharedStorage()
    {
        return false;
    }
}