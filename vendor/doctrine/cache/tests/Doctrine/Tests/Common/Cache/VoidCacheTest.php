<?php

namespace Doctrine\Tests\Common\Cache;

use Doctrine\Common\Cache\VoidCache;

/**
 * @covers \Doctrine\Common\Cache\VoidCache
 */
class VoidCacheTest extends \PHPUnit_Framework_TestCase
{
    public function testShouldAlwaysReturnFalseOnContains()
    {
        $cache = new VoidCache();

        $this->assertFalse($cache->contains('foo'));
        $this->assertFalse($cache->contains('bar'));
    }

    public function testShouldAlwaysReturnFalseOnFetch()
    {
        $cache = new VoidCache();

        $this->assertFalse($cache->fetch('foo'));
        $this->assertFalse($cache->fetch('bar'));
    }

    public function testShouldAlwaysReturnTrueOnSaveButNotStoreAnything()
    {
        $cache = new VoidCache();

        $this->assertTrue($cache->save('foo', 'fooVal'));

        $this->assertFalse($cache->contains('foo'));
        $this->assertFalse($cache->fetch('foo'));
    }

    public function testShouldAlwaysReturnTrueOnDelete()
    {
        $cache = new VoidCache();

        $this->assertTrue($cache->delete('foo'));
    }

    public function testShouldAlwaysReturnNullOnGetStatus()
    {
        $cache = new VoidCache();

        $this->assertNull($cache->getStats());
    }

    public function testShouldAlwaysReturnTrueOnFlush()
    {
        $cache = new VoidCache();

        $this->assertTrue($cache->flushAll());
    }
}
