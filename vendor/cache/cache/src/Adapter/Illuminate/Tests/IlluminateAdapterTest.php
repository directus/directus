<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\Illuminate\Tests;

use Cache\Adapter\Common\CacheItem;
use Cache\Adapter\Illuminate\IlluminateCachePool;
use Illuminate\Contracts\Cache\Store;
use Mockery as m;
use Mockery\MockInterface;
use PHPUnit\Framework\TestCase;
use Psr\Cache\CacheItemPoolInterface;

class IlluminateAdapterTest extends TestCase
{
    /**
     * @type IlluminateCachePool
     */
    private $pool;

    /**
     * @type MockInterface|CacheItem
     */
    private $mockItem;

    /**
     * @type MockInterface|Store
     */
    private $mockStore;

    protected function setUp()
    {
        $this->mockItem  = m::mock(CacheItem::class);
        $this->mockStore = m::mock(Store::class);
        $this->pool      = new IlluminateCachePool($this->mockStore);
    }

    public function testConstructor()
    {
        $this->assertInstanceOf(IlluminateCachePool::class, $this->pool);
        $this->assertInstanceOf(CacheItemPoolInterface::class, $this->pool);
    }
}
