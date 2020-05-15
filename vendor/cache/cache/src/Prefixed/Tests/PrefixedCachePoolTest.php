<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Prefixed\Tests;

use Cache\Prefixed\PrefixedCachePool;
use PHPUnit\Framework\TestCase;
use Psr\Cache\CacheItemInterface;
use Psr\Cache\CacheItemPoolInterface;

/**
 * @author Tobias Nyholm <tobias.nyholm@gmail.com>
 */
class PrefixedCachePoolTest extends TestCase
{
    /**
     * @return \PHPUnit_Framework_MockObject_MockObject|CacheItemPoolInterface
     */
    private function getCacheStub()
    {
        return $this->getMockBuilder(CacheItemPoolInterface::class)->setMethods(
            ['getItem', 'getItems', 'hasItem', 'clear', 'deleteItem', 'deleteItems', 'save', 'saveDeferred', 'commit']
        )->getMock();
    }

    public function testGetItem()
    {
        $prefix      = 'ns';
        $key         = 'key';
        $returnValue = true;

        $stub = $this->getCacheStub();
        $stub->expects($this->once())->method('getItem')->with($prefix.$key)->willReturn($returnValue);

        $pool = new PrefixedCachePool($stub, $prefix);
        $this->assertEquals($returnValue, $pool->getItem($key));
    }

    public function testGetItems()
    {
        $prefix      = 'ns';
        $key0        = 'key0';
        $key1        = 'key1';
        $returnValue = true;

        $stub = $this->getCacheStub();
        $stub->expects($this->once())->method('getItems')->with([$prefix.$key0, $prefix.$key1])->willReturn($returnValue);

        $pool = new PrefixedCachePool($stub, $prefix);
        $this->assertEquals($returnValue, $pool->getItems([$key0, $key1]));
    }

    public function testHasItem()
    {
        $prefix      = 'ns';
        $key         = 'key';
        $returnValue = true;

        $stub = $this->getCacheStub();
        $stub->expects($this->once())->method('hasItem')->with($prefix.$key)->willReturn($returnValue);

        $pool = new PrefixedCachePool($stub, $prefix);
        $this->assertEquals($returnValue, $pool->hasItem($key));
    }

    public function testClear()
    {
        $prefix      = 'ns';
        $key         = 'key';
        $returnValue = true;

        $stub = $this->getCacheStub();
        $stub->expects($this->once())->method('clear')->willReturn($returnValue);

        $pool = new PrefixedCachePool($stub, $prefix);
        $this->assertEquals($returnValue, $pool->clear());
    }

    public function testDeleteItem()
    {
        $prefix      = 'ns';
        $key         = 'key';
        $returnValue = true;

        $stub = $this->getCacheStub();
        $stub->expects($this->once())->method('deleteItem')->with($prefix.$key)->willReturn($returnValue);

        $pool = new PrefixedCachePool($stub, $prefix);
        $this->assertEquals($returnValue, $pool->deleteItem($key));
    }

    public function testDeleteItems()
    {
        $prefix      = 'ns';
        $key0        = 'key0';
        $key1        = 'key1';
        $returnValue = true;

        $stub = $this->getCacheStub();
        $stub->expects($this->once())->method('deleteItems')->with([$prefix.$key0, $prefix.$key1])->willReturn($returnValue);

        $pool = new PrefixedCachePool($stub, $prefix);
        $this->assertEquals($returnValue, $pool->deleteItems([$key0, $key1]));
    }

    public function testSave()
    {
        /** @type CacheItemInterface $item */
        $item        = $this->getMockBuilder(CacheItemInterface::class)->getMock();
        $prefix      = 'ns';
        $returnValue = true;

        $stub = $this->getCacheStub();
        $stub->expects($this->once())->method('save')->with($item)->willReturn($returnValue);

        $pool = new PrefixedCachePool($stub, $prefix);
        $this->assertEquals($returnValue, $pool->save($item));
    }

    public function testSaveDeffered()
    {
        /** @type CacheItemInterface $item */
        $item        = $this->getMockBuilder(CacheItemInterface::class)->getMock();
        $prefix      = 'ns';
        $returnValue = true;

        $stub = $this->getCacheStub();
        $stub->expects($this->once())->method('saveDeferred')->with($item)->willReturn($returnValue);

        $pool = new PrefixedCachePool($stub, $prefix);
        $this->assertEquals($returnValue, $pool->saveDeferred($item));
    }

    public function testCommit()
    {
        $prefix      = 'ns';
        $returnValue = true;

        $stub = $this->getCacheStub();
        $stub->expects($this->once())->method('commit')->willReturn($returnValue);

        $pool = new PrefixedCachePool($stub, $prefix);
        $this->assertEquals($returnValue, $pool->commit());
    }
}
