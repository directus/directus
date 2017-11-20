<?php

namespace Doctrine\Tests\Common\Cache;

use Doctrine\Common\Cache\Cache;
use Doctrine\Common\Cache\FilesystemCache;

/**
 * @group DCOM-101
 */
class FilesystemCacheTest extends BaseFileCacheTest
{
    public function testGetStats()
    {
        $cache = $this->_getCacheDriver();
        $stats = $cache->getStats();

        $this->assertNull($stats[Cache::STATS_HITS]);
        $this->assertNull($stats[Cache::STATS_MISSES]);
        $this->assertNull($stats[Cache::STATS_UPTIME]);
        $this->assertEquals(0, $stats[Cache::STATS_MEMORY_USAGE]);
        $this->assertGreaterThan(0, $stats[Cache::STATS_MEMORY_AVAILABLE]);
    }

    public function testCacheInSharedDirectoryIsPerExtension()
    {
        $cache1 = new FilesystemCache($this->directory, '.foo');
        $cache2 = new FilesystemCache($this->directory, '.bar');

        $this->assertTrue($cache1->save('key1', 11));
        $this->assertTrue($cache1->save('key2', 12));

        $this->assertTrue($cache2->save('key1', 21));
        $this->assertTrue($cache2->save('key2', 22));

        $this->assertSame(11, $cache1->fetch('key1'), 'Cache value must not be influenced by a different cache in the same directory but different extension');
        $this->assertSame(12, $cache1->fetch('key2'));
        $this->assertTrue($cache1->flushAll());
        $this->assertFalse($cache1->fetch('key1'), 'flushAll() must delete all items with the current extension');
        $this->assertFalse($cache1->fetch('key2'));

        $this->assertSame(21, $cache2->fetch('key1'), 'flushAll() must not remove items with a different extension in a shared directory');
        $this->assertSame(22, $cache2->fetch('key2'));
    }

    public function testFlushAllWithNoExtension()
    {
        $cache = new FilesystemCache($this->directory, '');

        $this->assertTrue($cache->save('key1', 1));
        $this->assertTrue($cache->save('key2', 2));
        $this->assertTrue($cache->flushAll());
        $this->assertFalse($cache->contains('key1'));
        $this->assertFalse($cache->contains('key2'));
    }

    protected function _getCacheDriver()
    {
        return new FilesystemCache($this->directory);
    }
}
