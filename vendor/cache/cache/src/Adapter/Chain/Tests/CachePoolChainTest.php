<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\Chain\Tests;

use Cache\Adapter\Chain\CachePoolChain;
use Cache\Adapter\Common\CacheItem;
use Cache\Adapter\PHPArray\ArrayCachePool;
use PHPUnit\Framework\TestCase;

/**
 * Class ChainPoolTest.
 */
class CachePoolChainTest extends TestCase
{
    public function testGetItemStoreToPrevious()
    {
        $firstPool  = new ArrayCachePool();
        $secondPool = new ArrayCachePool();
        $chainPool  = new CachePoolChain([$firstPool, $secondPool]);

        $key  = 'test_key';
        $item = new CacheItem($key, true, 'value');
        $item->expiresAfter(60);
        $secondPool->save($item);

        $loadedItem = $firstPool->getItem($key);
        $this->assertFalse($loadedItem->isHit());

        $loadedItem = $secondPool->getItem($key);
        $this->assertTrue($loadedItem->isHit());

        $loadedItem = $chainPool->getItem($key);
        $this->assertTrue($loadedItem->isHit());

        $loadedItem = $firstPool->getItem($key);
        $this->assertTrue($loadedItem->isHit());
    }

    public function testGetItemsStoreToPrevious()
    {
        $firstPool  = new ArrayCachePool();
        $secondPool = new ArrayCachePool();
        $chainPool  = new CachePoolChain([$firstPool, $secondPool]);

        $key  = 'test_key';
        $item = new CacheItem($key, true, 'value');
        $item->expiresAfter(60);
        $secondPool->save($item);
        $firstExpirationTime = $item->getExpirationTimestamp();

        $key2 = 'test_key2';
        $item = new CacheItem($key2, true, 'value2');
        $item->expiresAfter(60);
        $secondPool->save($item);
        $secondExpirationTime = $item->getExpirationTimestamp();

        $loadedItem = $firstPool->getItem($key);
        $this->assertFalse($loadedItem->isHit());

        $loadedItem = $firstPool->getItem($key2);
        $this->assertFalse($loadedItem->isHit());

        $loadedItem = $secondPool->getItem($key);
        $this->assertTrue($loadedItem->isHit());

        $loadedItem = $secondPool->getItem($key2);
        $this->assertTrue($loadedItem->isHit());

        $items = $chainPool->getItems([$key, $key2]);

        $this->assertArrayHasKey($key, $items);
        $this->assertArrayHasKey($key2, $items);

        $this->assertTrue($items[$key]->isHit());
        $this->assertTrue($items[$key2]->isHit());

        $loadedItem = $firstPool->getItem($key);
        $this->assertTrue($loadedItem->isHit());
        $this->assertEquals($firstExpirationTime, $loadedItem->getExpirationTimestamp());

        $loadedItem = $firstPool->getItem($key2);
        $this->assertTrue($loadedItem->isHit());
        $this->assertEquals($secondExpirationTime, $loadedItem->getExpirationTimestamp());
    }

    public function testGetItemsWithEmptyCache()
    {
        $firstPool  = new ArrayCachePool();
        $secondPool = new ArrayCachePool();
        $chainPool  = new CachePoolChain([$firstPool, $secondPool]);

        $key  = 'test_key';
        $key2 = 'test_key2';

        $items = $chainPool->getItems([$key, $key2]);

        $this->assertArrayHasKey($key, $items);
        $this->assertArrayHasKey($key2, $items);

        $this->assertFalse($items[$key]->isHit());
        $this->assertFalse($items[$key2]->isHit());
    }
}
