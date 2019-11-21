<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Hierarchy\Tests;

use Cache\Hierarchy\Tests\Helper\CachePool;
use PHPUnit\Framework\TestCase;

/**
 * We should not use constants on interfaces in the tests. Tests should break if the constant is changed.
 *
 * @author Tobias Nyholm <tobias.nyholm@gmail.com>
 */
class HierarchicalCachePoolTest extends TestCase
{
    private function assertEqualsSha1($expected, $result, $message = '')
    {
        $this->assertEquals(sha1($expected), $result, $message);
    }

    public function testGetHierarchyKey()
    {
        $path = null;

        $pool   = new CachePool();
        $result = $pool->exposeGetHierarchyKey('key', $path);
        $this->assertEquals('key', $result);
        $this->assertNull($path);

        $pool   = new CachePool(['idx_1', 'idx_2', 'idx_3']);
        $result = $pool->exposeGetHierarchyKey('|foo|bar', $path);
        $this->assertEqualsSha1('root!!idx_1!foo!!idx_2!bar!!idx_3!', $result);
        $this->assertEqualsSha1('path!root!!idx_1!foo!!idx_2!bar!', $path);

        $pool   = new CachePool(['idx_1', 'idx_2', 'idx_3']);
        $result = $pool->exposeGetHierarchyKey('|', $path);
        $this->assertEqualsSha1('path!root!', $path);
        $this->assertEqualsSha1('root!!idx_1!', $result);
    }

    public function testGetHierarchyKeyWithTags()
    {
        $path = null;

        $pool   = new CachePool();
        $result = $pool->exposeGetHierarchyKey('key!tagHash', $path);
        $this->assertEquals('key!tagHash', $result);
        $this->assertNull($path);

        $pool   = new CachePool(['idx_1', 'idx_2', 'idx_3']);
        $result = $pool->exposeGetHierarchyKey('|foo|bar!tagHash', $path);
        $this->assertEqualsSha1('root!tagHash!idx_1!foo!tagHash!idx_2!bar!tagHash!idx_3!', $result);
        $this->assertEqualsSha1('path!root!tagHash!idx_1!foo!tagHash!idx_2!bar!tagHash', $path);

        $pool   = new CachePool(['idx_1', 'idx_2', 'idx_3']);
        $result = $pool->exposeGetHierarchyKey('|!tagHash', $path);
        $this->assertEqualsSha1('path!root!tagHash', $path);
        $this->assertEqualsSha1('root!tagHash!idx_1!', $result);
    }

    public function testGetHierarchyKeyEmptyCache()
    {
        $pool = new CachePool();
        $path = null;

        $result = $pool->exposeGetHierarchyKey('key', $path);
        $this->assertEquals('key', $result);
        $this->assertNull($path);

        $result = $pool->exposeGetHierarchyKey('|foo|bar', $path);
        $this->assertEqualsSha1('root!!!foo!!!bar!!!', $result);
        $this->assertEqualsSha1('path!root!!!foo!!!bar!', $path);

        $result = $pool->exposeGetHierarchyKey('|', $path);
        $this->assertEqualsSha1('path!root!', $path);
        $this->assertEqualsSha1('root!!!', $result);
    }

    public function testKeyCache()
    {
        $path = null;

        $pool   = new CachePool(['idx_1', 'idx_2', 'idx_3']);
        $result = $pool->exposeGetHierarchyKey('|foo', $path);
        $this->assertEqualsSha1('root!!idx_1!foo!!idx_2!', $result);
        $this->assertEqualsSha1('path!root!!idx_1!foo!', $path);

        // Make sure re reuse the old index value we already looked up for 'root'.
        $result = $pool->exposeGetHierarchyKey('|bar', $path);
        $this->assertEqualsSha1('root!!idx_1!bar!!idx_3!', $result);
        $this->assertEqualsSha1('path!root!!idx_1!bar!', $path);
    }

    public function testClearHierarchyKeyCache()
    {
        $pool = new CachePool();
        $prop = new \ReflectionProperty('Cache\Hierarchy\Tests\Helper\CachePool', 'keyCache');
        $prop->setAccessible(true);

        // add some values to the prop and make sure they are beeing cleared
        $prop->setValue($pool, ['foo' => 'bar', 'baz' => 'biz']);
        $pool->exposeClearHierarchyKeyCache();
        $this->assertEmpty($prop->getValue($pool), 'The key cache must be cleared after ::ClearHierarchyKeyCache');
    }

    public function testIsHierarchyKey()
    {
        $pool   = new CachePool();
        $method = new \ReflectionMethod('Cache\Hierarchy\Tests\Helper\CachePool', 'isHierarchyKey');
        $method->setAccessible(true);

        $this->assertFalse($method->invoke($pool, 'key'));
        $this->assertFalse($method->invoke($pool, 'key|bar'));
        $this->assertFalse($method->invoke($pool, 'key|'));
        $this->assertTrue($method->invoke($pool, '|key'));
        $this->assertTrue($method->invoke($pool, '|key|bar'));
    }

    public function testExplodeKey()
    {
        $pool   = new CachePool();
        $method = new \ReflectionMethod('Cache\Hierarchy\Tests\Helper\CachePool', 'explodeKey');
        $method->setAccessible(true);

        $result = $method->invoke($pool, '|key');
        $this->assertCount(2, $result);
        $this->assertEquals('key!', $result[1]);
        $this->assertTrue(in_array('key!', $result));

        $result = $method->invoke($pool, '|key|bar');
        $this->assertCount(3, $result);
        $this->assertTrue(in_array('key!', $result));
        $this->assertTrue(in_array('bar!', $result));

        $result = $method->invoke($pool, '|');
        $this->assertCount(1, $result);
    }

    public function testExplodeKeyWithTags()
    {
        $pool   = new CachePool();
        $method = new \ReflectionMethod('Cache\Hierarchy\Tests\Helper\CachePool', 'explodeKey');
        $method->setAccessible(true);

        $result = $method->invoke($pool, '|key|bar!hash');
        $this->assertCount(3, $result);
        foreach ($result as $r) {
            $this->assertRegExp('|.*!hash|s', $r, 'Tag hash must be on every level in hierarchy key');
        }

        $result = $method->invoke($pool, '|!hash');
        $this->assertCount(1, $result);
        $this->assertRegExp('|.*!hash|s', $result[0], 'Tag hash must on root level in hierarchy key');
    }
}
