<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Util\Tests;

use Cache\Adapter\PHPArray\ArrayCachePool;
use Cache\Util;

class SimpleCacheUtilTest extends \PHPUnit_Framework_TestCase
{
    public function testRememberCacheHit()
    {
        $cache = new ArrayCachePool();
        $cache->set('foo', 'bar');
        $res = Util\SimpleCache\remember($cache, 'foo', null, function () {
            throw new \Exception('bad');
        });
        $this->assertEquals('bar', $res);
    }

    public function testRememberCacheMiss()
    {
        $cache = new ArrayCachePool();
        $res   = Util\SimpleCache\remember($cache, 'foo', null, function () {
            return 'bar';
        });
        $this->assertEquals('bar', $res);
        $this->assertEquals('bar', $cache->get('foo'));
    }
}
