<?php

namespace Doctrine\Tests\Common\Cache;

use Doctrine\Common\Cache\ApcCache;
use Doctrine\Common\Cache\ArrayCache;
use Doctrine\Common\Cache\ChainCache;

class ChainCacheTest extends CacheTest
{
    protected function _getCacheDriver()
    {
        return new ChainCache(array(new ArrayCache()));
    }

    public function testLifetime()
    {
        $this->markTestSkipped('The ChainCache test uses ArrayCache which does not implement TTL currently.');
    }

    public function testGetStats()
    {
        $cache = $this->_getCacheDriver();
        $stats = $cache->getStats();

        $this->assertInternalType('array', $stats);
    }

    public function testOnlyFetchFirstOne()
    {
        $cache1 = new ArrayCache();
        $cache2 = $this->getMockForAbstractClass('Doctrine\Common\Cache\CacheProvider');

        $cache2->expects($this->never())->method('doFetch');

        $chainCache = new ChainCache(array($cache1, $cache2));
        $chainCache->save('id', 'bar');

        $this->assertEquals('bar', $chainCache->fetch('id'));
    }

    public function testFetchPropagateToFastestCache()
    {
        $cache1 = new ArrayCache();
        $cache2 = new ArrayCache();

        $cache2->save('bar', 'value');

        $chainCache = new ChainCache(array($cache1, $cache2));

        $this->assertFalse($cache1->contains('bar'));

        $result = $chainCache->fetch('bar');

        $this->assertEquals('value', $result);
        $this->assertTrue($cache2->contains('bar'));
    }

    public function testNamespaceIsPropagatedToAllProviders()
    {
        $cache1 = new ArrayCache();
        $cache2 = new ArrayCache();

        $chainCache = new ChainCache(array($cache1, $cache2));
        $chainCache->setNamespace('bar');

        $this->assertEquals('bar', $cache1->getNamespace());
        $this->assertEquals('bar', $cache2->getNamespace());
    }

    public function testDeleteToAllProviders()
    {
        $cache1 = $this->getMockForAbstractClass('Doctrine\Common\Cache\CacheProvider');
        $cache2 = $this->getMockForAbstractClass('Doctrine\Common\Cache\CacheProvider');

        $cache1->expects($this->once())->method('doDelete');
        $cache2->expects($this->once())->method('doDelete');

        $chainCache = new ChainCache(array($cache1, $cache2));
        $chainCache->delete('bar');
    }

    public function testFlushToAllProviders()
    {
        $cache1 = $this->getMockForAbstractClass('Doctrine\Common\Cache\CacheProvider');
        $cache2 = $this->getMockForAbstractClass('Doctrine\Common\Cache\CacheProvider');

        $cache1->expects($this->once())->method('doFlush');
        $cache2->expects($this->once())->method('doFlush');

        $chainCache = new ChainCache(array($cache1, $cache2));
        $chainCache->flushAll();
    }

    protected function isSharedStorage()
    {
        return false;
    }
}