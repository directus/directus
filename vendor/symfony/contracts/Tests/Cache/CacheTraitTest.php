<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Contracts\Tests\Cache;

use PHPUnit\Framework\TestCase;
use Psr\Cache\CacheItemInterface;
use Psr\Cache\CacheItemPoolInterface;
use Symfony\Contracts\Cache\CacheTrait;

/**
 * @author Tobias Nyholm <tobias.nyholm@gmail.com>
 */
class CacheTraitTest extends TestCase
{
    public function testSave()
    {
        $item = $this->getMockBuilder(CacheItemInterface::class)->getMock();
        $item->method('set')
            ->willReturn($item);
        $item->method('isHit')
            ->willReturn(false);

        $item->expects($this->once())
            ->method('set')
            ->with('computed data');

        $cache = $this->getMockBuilder(TestPool::class)
            ->setMethods(['getItem', 'save'])
            ->getMock();
        $cache->expects($this->once())
            ->method('getItem')
            ->with('key')
            ->willReturn($item);
        $cache->expects($this->once())
            ->method('save');

        $callback = function (CacheItemInterface $item) {
            return 'computed data';
        };

        $cache->get('key', $callback);
    }

    public function testNoCallbackCallOnHit()
    {
        $item = $this->getMockBuilder(CacheItemInterface::class)->getMock();
        $item->method('isHit')
            ->willReturn(true);

        $item->expects($this->never())
            ->method('set');

        $cache = $this->getMockBuilder(TestPool::class)
            ->setMethods(['getItem', 'save'])
            ->getMock();

        $cache->expects($this->once())
            ->method('getItem')
            ->with('key')
            ->willReturn($item);
        $cache->expects($this->never())
            ->method('save');

        $callback = function (CacheItemInterface $item) {
            $this->assertTrue(false, 'This code should never be reached');
        };

        $cache->get('key', $callback);
    }

    public function testRecomputeOnBetaInf()
    {
        $item = $this->getMockBuilder(CacheItemInterface::class)->getMock();
        $item->method('set')
            ->willReturn($item);
        $item->method('isHit')
            // We want to recompute even if it is a hit
            ->willReturn(true);

        $item->expects($this->once())
            ->method('set')
            ->with('computed data');

        $cache = $this->getMockBuilder(TestPool::class)
            ->setMethods(['getItem', 'save'])
            ->getMock();

        $cache->expects($this->once())
            ->method('getItem')
            ->with('key')
            ->willReturn($item);
        $cache->expects($this->once())
            ->method('save');

        $callback = function (CacheItemInterface $item) {
            return 'computed data';
        };

        $cache->get('key', $callback, INF);
    }

    public function testExceptionOnNegativeBeta()
    {
        $cache = $this->getMockBuilder(TestPool::class)
            ->setMethods(['getItem', 'save'])
            ->getMock();

        $callback = function (CacheItemInterface $item) {
            return 'computed data';
        };

        $this->expectException(\InvalidArgumentException::class);
        $cache->get('key', $callback, -2);
    }
}

class TestPool implements CacheItemPoolInterface
{
    use CacheTrait;

    public function hasItem($key)
    {
    }

    public function deleteItem($key)
    {
    }

    public function deleteItems(array $keys = [])
    {
    }

    public function getItem($key)
    {
    }

    public function getItems(array $key = [])
    {
    }

    public function saveDeferred(CacheItemInterface $item)
    {
    }

    public function save(CacheItemInterface $item)
    {
    }

    public function commit()
    {
    }

    public function clear()
    {
    }
}
