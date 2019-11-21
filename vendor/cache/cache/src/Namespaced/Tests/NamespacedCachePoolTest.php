<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Namespaced\Tests;

use Cache\Namespaced\NamespacedCachePool;
use PHPUnit\Framework\TestCase;
use Psr\Cache\CacheItemInterface;

/**
 * We should not use constants on interfaces in the tests. Tests should break if the constant is changed.
 *
 * @author Tobias Nyholm <tobias.nyholm@gmail.com>
 */
class NamespacedCachePoolTest extends TestCase
{
    /**
     * @return \PHPUnit_Framework_MockObject_MockObject
     */
    private function getHierarchyCacheStub()
    {
        return $this->getMockBuilder(HelperInterface::class)->setMethods(
            ['getItem', 'getItems', 'hasItem', 'clear', 'deleteItem', 'deleteItems', 'save', 'saveDeferred', 'commit']
        )->getMock();
    }

    public function testGetItem()
    {
        $namespace   = 'ns';
        $key         = 'key';
        $returnValue = true;

        $stub = $this->getHierarchyCacheStub();
        $stub->expects($this->once())->method('getItem')->with('|'.$namespace.'|'.$key)->willReturn($returnValue);

        $pool = new NamespacedCachePool($stub, $namespace);
        $this->assertEquals($returnValue, $pool->getItem($key));
    }

    public function testGetItems()
    {
        $namespace   = 'ns';
        $key0        = 'key0';
        $key1        = 'key1';
        $returnValue = true;

        $stub = $this->getHierarchyCacheStub();
        $stub->expects($this->once())->method('getItems')->with(['|'.$namespace.'|'.$key0, '|'.$namespace.'|'.$key1])->willReturn($returnValue);

        $pool = new NamespacedCachePool($stub, $namespace);
        $this->assertEquals($returnValue, $pool->getItems([$key0, $key1]));
    }

    public function testHasItem()
    {
        $namespace   = 'ns';
        $key         = 'key';
        $returnValue = true;

        $stub = $this->getHierarchyCacheStub();
        $stub->expects($this->once())->method('hasItem')->with('|'.$namespace.'|'.$key)->willReturn($returnValue);

        $pool = new NamespacedCachePool($stub, $namespace);
        $this->assertEquals($returnValue, $pool->hasItem($key));
    }

    public function testClear()
    {
        $namespace   = 'ns';
        $key         = 'key';
        $returnValue = true;

        $stub = $this->getHierarchyCacheStub();
        $stub->expects($this->once())->method('deleteItem')->with('|'.$namespace)->willReturn($returnValue);

        $pool = new NamespacedCachePool($stub, $namespace);
        $this->assertEquals($returnValue, $pool->clear($key));
    }

    public function testDeleteItem()
    {
        $namespace   = 'ns';
        $key         = 'key';
        $returnValue = true;

        $stub = $this->getHierarchyCacheStub();
        $stub->expects($this->once())->method('deleteItem')->with('|'.$namespace.'|'.$key)->willReturn($returnValue);

        $pool = new NamespacedCachePool($stub, $namespace);
        $this->assertEquals($returnValue, $pool->deleteItem($key));
    }

    public function testDeleteItems()
    {
        $namespace   = 'ns';
        $key0        = 'key0';
        $key1        = 'key1';
        $returnValue = true;

        $stub = $this->getHierarchyCacheStub();
        $stub->expects($this->once())->method('deleteItems')->with(['|'.$namespace.'|'.$key0, '|'.$namespace.'|'.$key1])->willReturn($returnValue);

        $pool = new NamespacedCachePool($stub, $namespace);
        $this->assertEquals($returnValue, $pool->deleteItems([$key0, $key1]));
    }

    public function testSave()
    {
        $item        = $this->getMockBuilder(CacheItemInterface::class)->getMock();
        $namespace   = 'ns';
        $returnValue = true;

        $stub = $this->getHierarchyCacheStub();
        $stub->expects($this->once())->method('save')->with($item)->willReturn($returnValue);

        $pool = new NamespacedCachePool($stub, $namespace);
        $this->assertEquals($returnValue, $pool->save($item));
    }

    public function testSaveDeferred()
    {
        $item        = $this->getMockBuilder(CacheItemInterface::class)->getMock();
        $namespace   = 'ns';
        $returnValue = true;

        $stub = $this->getHierarchyCacheStub();
        $stub->expects($this->once())->method('saveDeferred')->with($item)->willReturn($returnValue);

        $pool = new NamespacedCachePool($stub, $namespace);
        $this->assertEquals($returnValue, $pool->saveDeferred($item));
    }

    public function testCommit()
    {
        $namespace   = 'ns';
        $returnValue = true;

        $stub = $this->getHierarchyCacheStub();
        $stub->expects($this->once())->method('commit')->willReturn($returnValue);

        $pool = new NamespacedCachePool($stub, $namespace);
        $this->assertEquals($returnValue, $pool->commit());
    }
}
