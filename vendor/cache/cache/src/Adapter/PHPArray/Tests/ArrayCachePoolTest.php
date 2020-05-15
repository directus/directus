<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\PHPArray\Tests;

use Cache\Adapter\PHPArray\ArrayCachePool;
use PHPUnit\Framework\TestCase;

class ArrayCachePoolTest extends TestCase
{
    public function testLimit()
    {
        $pool = new ArrayCachePool(2);
        $item = $pool->getItem('key1')->set('value1');
        $pool->save($item);

        $item = $pool->getItem('key2')->set('value2');
        $pool->save($item);

        // Both items should be in the pool, nothing strange yet
        $this->assertTrue($pool->hasItem('key1'));
        $this->assertTrue($pool->hasItem('key2'));

        $item = $pool->getItem('key3')->set('value3');
        $pool->save($item);

        // First item should be dropped
        $this->assertFalse($pool->hasItem('key1'));
        $this->assertTrue($pool->hasItem('key2'));
        $this->assertTrue($pool->hasItem('key3'));

        $this->assertFalse($pool->getItem('key1')->isHit());
        $this->assertTrue($pool->getItem('key2')->isHit());
        $this->assertTrue($pool->getItem('key3')->isHit());

        $item = $pool->getItem('key4')->set('value4');
        $pool->save($item);

        // Only the last two items should be in place
        $this->assertFalse($pool->hasItem('key1'));
        $this->assertFalse($pool->hasItem('key2'));
        $this->assertTrue($pool->hasItem('key3'));
        $this->assertTrue($pool->hasItem('key4'));
    }

    public function testRemoveListItem()
    {
        $pool       = new ArrayCachePool();
        $reflection = new \ReflectionClass(get_class($pool));
        $method     = $reflection->getMethod('removeListItem');
        $method->setAccessible(true);

        // Add a tagged item to test list removal
        $item = $pool->getItem('key1')->set('value1')->setTags(['tag1']);
        $pool->save($item);

        $this->assertTrue($pool->hasItem('key1'));
        $this->assertTrue($pool->deleteItem('key1'));
        $this->assertFalse($pool->hasItem('key1'));

        // Trying to remove an item in an un-existing tag list should not throw
        // Notice error / Exception in strict mode
        $this->assertNull($method->invokeArgs($pool, ['tag1', 'key1']));
    }
}
