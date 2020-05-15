<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\Doctrine\Tests;

use Cache\Adapter\Common\CacheItem;
use Cache\Adapter\Doctrine\DoctrineCachePool;
use Doctrine\Common\Cache\Cache;
use Doctrine\Common\Cache\FlushableCache;
use Mockery as m;
use Mockery\MockInterface;
use PHPUnit\Framework\TestCase;
use Psr\Cache\CacheItemPoolInterface;

/**
 * @author Aaron Scherer <aequasi@gmail.com>
 */
class DoctrineAdapterTest extends TestCase
{
    /**
     * @type DoctrineCachePool
     */
    private $pool;

    /**
     * @type MockInterface|CacheItem
     */
    private $mockItem;

    /**
     * @type MockInterface|Cache
     */
    private $mockDoctrine;

    protected function setUp()
    {
        $this->mockItem     = m::mock(CacheItem::class);
        $this->mockDoctrine = m::mock(Cache::class);

        $this->pool = new DoctrineCachePool($this->mockDoctrine);
    }

    public function testConstructor()
    {
        $this->assertInstanceOf(DoctrineCachePool::class, $this->pool);
        $this->assertInstanceOf(CacheItemPoolInterface::class, $this->pool);
    }

    public function testGetCache()
    {
        $this->assertInstanceOf(Cache::class, $this->pool->getCache());
        $this->assertEquals($this->mockDoctrine, $this->pool->getCache());
    }

    public function testClear()
    {
        $this->assertFalse($this->pool->clear());

        $cache = m::mock(Cache::class.','.FlushableCache::class);
        $cache->shouldReceive('flushAll')->andReturn(true);

        $newPool = new DoctrineCachePool($cache);
        $this->assertTrue($newPool->clear());

        $cache->shouldReceive('fetch');
        $cache->shouldReceive('save');
        $this->assertTrue($newPool->clear(['dummy_tag']));
    }
}
