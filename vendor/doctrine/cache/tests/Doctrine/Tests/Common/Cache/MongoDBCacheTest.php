<?php

namespace Doctrine\Tests\Common\Cache;

use Doctrine\Common\Cache\Cache;
use Doctrine\Common\Cache\MongoDBCache;
use MongoClient;
use MongoCollection;

/**
 * @requires extension mongo
 */
class MongoDBCacheTest extends CacheTest
{
    /**
     * @var MongoCollection
     */
    private $collection;

    protected function setUp()
    {
        if ( ! version_compare(phpversion('mongo'), '1.3.0', '>=')) {
            $this->markTestSkipped('Mongo >= 1.3.0 is required.');
        }

        $mongo = new MongoClient();
        $this->collection = $mongo->selectCollection('doctrine_common_cache', 'test');
    }

    protected function tearDown()
    {
        if ($this->collection instanceof MongoCollection) {
            $this->collection->drop();
        }
    }

    public function testGetStats()
    {
        $cache = $this->_getCacheDriver();
        $stats = $cache->getStats();

        $this->assertNull($stats[Cache::STATS_HITS]);
        $this->assertNull($stats[Cache::STATS_MISSES]);
        $this->assertGreaterThan(0, $stats[Cache::STATS_UPTIME]);
        $this->assertEquals(0, $stats[Cache::STATS_MEMORY_USAGE]);
        $this->assertNull($stats[Cache::STATS_MEMORY_AVAILABLE]);
    }

    /**
     * @group 108
     */
    public function testMongoCursorExceptionsDoNotBubbleUp()
    {
        /* @var $collection \MongoCollection|\PHPUnit_Framework_MockObject_MockObject */
        $collection = $this->getMock('MongoCollection', array(), array(), '', false);

        $collection->expects(self::once())->method('update')->willThrowException(new \MongoCursorException());

        $cache = new MongoDBCache($collection);

        self::assertFalse($cache->save('foo', 'bar'));
    }

    protected function _getCacheDriver()
    {
        return new MongoDBCache($this->collection);
    }
}
