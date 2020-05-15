<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\Redis\Tests;

use Cache\Adapter\Redis\RedisCachePool;

class RedisCachePoolTest extends \PHPUnit_Framework_TestCase
{
    /**
     * Tests that an exception is thrown if invalid object is
     * passed to the constructor.
     *
     * @expectedException \Cache\Adapter\Common\Exception\CachePoolException
     */
    public function testConstructorWithInvalidObject()
    {
        new RedisCachePool(new \stdClass());
    }
}
