<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\SessionHandler\Tests;

use Cache\Adapter\PHPArray\ArrayCachePool;
use Cache\SessionHandler\Psr6SessionHandler;
use Psr\Cache\CacheItemInterface;
use Psr\Cache\CacheItemPoolInterface;

/**
 * @author Aaron Scherer <aequasi@gmail.com>
 * @author Tobias Nyholm <tobias.nyholm@gmail.com>
 * @author Daniel Bannert <d.bannert@anolilab.de>s
 */
class Psr6SessionHandlerTest extends AbstractSessionHandlerTest
{
    /**
     * @type \PHPUnit_Framework_MockObject_MockObject|CacheItemPoolInterface
     */
    private $psr6;

    protected function setUp()
    {
        parent::setUp();

        $this->psr6 = $this->getMockBuilder(ArrayCachePool::class)
            ->setMethods(['getItem', 'deleteItem', 'save'])
            ->getMock();
        $this->handler = new Psr6SessionHandler($this->psr6, ['prefix' => self::PREFIX, 'ttl' => self::TTL]);
    }

    public function testReadMiss()
    {
        $item = $this->getItemMock();
        $item->expects($this->once())
            ->method('isHit')
            ->willReturn(false);
        $this->psr6->expects($this->once())
            ->method('getItem')
            ->willReturn($item);

        $this->assertEquals('', $this->handler->read('foo'));
    }

    public function testReadHit()
    {
        $item = $this->getItemMock();
        $item->expects($this->once())
            ->method('isHit')
            ->willReturn(true);
        $item->expects($this->once())
            ->method('get')
            ->willReturn('bar');
        $this->psr6->expects($this->once())
            ->method('getItem')
            ->willReturn($item);

        $this->assertEquals('bar', $this->handler->read('foo'));
    }

    public function testWrite()
    {
        $item = $this->getItemMock();
        $item->expects($this->once())
            ->method('set')
            ->with('session value')
            ->willReturnSelf();
        $item->expects($this->once())
            ->method('expiresAfter')
            ->with(self::TTL)
            ->willReturnSelf();
        $this->psr6->expects($this->once())
            ->method('getItem')
            ->with(self::PREFIX.'foo')
            ->willReturn($item);
        $this->psr6->expects($this->once())
            ->method('save')
            ->with($item)
            ->willReturn(true);

        $this->assertTrue($this->handler->write('foo', 'session value'));
    }

    public function testDestroy()
    {
        $this->psr6->expects($this->once())
            ->method('deleteItem')
            ->with(self::PREFIX.'foo')
            ->willReturn(true);
        $this->assertTrue($this->handler->destroy('foo'));
    }

    /**
     * @dataProvider getOptionFixtures
     */
    public function testSupportedOptions($options, $supported)
    {
        try {
            new Psr6SessionHandler($this->psr6, $options);

            $this->assertTrue($supported);
        } catch (\InvalidArgumentException $e) {
            $this->assertFalse($supported);
        }
    }

    public function getOptionFixtures()
    {
        return [
            [['prefix' => 'session'], true],
            [['ttl' => 100], true],
            [['prefix' => 'session', 'ttl' => 200], true],
            [['ttl' => 100, 'foo' => 'bar'], false],
        ];
    }

    public function testUpdateTimestamp()
    {
        $item = $this->getItemMock();
        $item->expects($this->once())
            ->method('set')
            ->with('session value')
            ->willReturnSelf();
        $item->expects($this->once())
            ->method('expiresAfter')
            ->with(self::TTL)
            ->willReturnSelf();
        $item->expects($this->once())
            ->method('expiresAt')
            ->with(\DateTime::createFromFormat('U', \time() + self::TTL))
            ->willReturnSelf();
        $this->psr6->expects($this->exactly(2))
            ->method('getItem')
            ->with(self::PREFIX.'foo')
            ->willReturn($item);
        $this->psr6->expects($this->exactly(2))
            ->method('save')
            ->with($item)
            ->willReturn(true);

        $this->handler->write('foo', 'session value');

        $this->assertTrue($this->handler->updateTimestamp('foo', 'session value'));
    }

    public function testValidateId()
    {
        $item = $this->getItemMock();
        $item->expects($this->once())
            ->method('isHit')
            ->willReturn(true);
        $item->expects($this->once())
            ->method('get')
            ->willReturn('bar');
        $this->psr6->expects($this->once())
            ->method('getItem')
            ->willReturn($item);

        $this->assertTrue($this->handler->validateId('foo'));
    }

    /**
     * @return \PHPUnit_Framework_MockObject_MockObject
     */
    private function getItemMock()
    {
        return $this->getMockBuilder(CacheItemInterface::class)
            ->setMethods(['isHit', 'getKey', 'get', 'set', 'expiresAt', 'expiresAfter'])
            ->getMock();
    }
}
