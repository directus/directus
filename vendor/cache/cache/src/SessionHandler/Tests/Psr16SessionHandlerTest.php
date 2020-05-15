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
use Cache\SessionHandler\Psr16SessionHandler;
use Psr\SimpleCache\CacheInterface;

/**
 * @author Daniel Bannert <d.bannert@anolilab.de>s
 */
class Psr16SessionHandlerTest extends AbstractSessionHandlerTest
{
    /**
     * @type \PHPUnit_Framework_MockObject_MockObject|CacheInterface
     */
    private $psr16;

    protected function setUp()
    {
        parent::setUp();

        $this->psr16 = $this->getMockBuilder(ArrayCachePool::class)
            ->setMethods(['get', 'set', 'delete'])
            ->getMock();
        $this->handler = new Psr16SessionHandler($this->psr16, ['prefix' => self::PREFIX, 'ttl' => self::TTL]);
    }

    public function testReadMiss()
    {
        $this->psr16->expects($this->once())
            ->method('get')
            ->willReturn('');

        $this->assertEquals('', $this->handler->read('foo'));
    }

    public function testReadHit()
    {
        $this->psr16->expects($this->once())
            ->method('get')
            ->with(self::PREFIX.'foo', '')
            ->willReturn('bar');

        $this->assertEquals('bar', $this->handler->read('foo'));
    }

    public function testWrite()
    {
        $this->psr16->expects($this->once())
            ->method('set')
            ->with(self::PREFIX.'foo', 'session value', self::TTL)
            ->willReturn(true);

        $this->assertTrue($this->handler->write('foo', 'session value'));
    }

    public function testDestroy()
    {
        $this->psr16->expects($this->once())
            ->method('delete')
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
            new Psr16SessionHandler($this->psr16, $options);

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
        $this->psr16->expects($this->once())
            ->method('get')
            ->with(self::PREFIX.'foo')
            ->willReturn('session value');
        $this->psr16->expects($this->once())
            ->method('set')
            ->with(self::PREFIX.'foo', 'session value', \DateTime::createFromFormat('U', \time() + self::TTL))
            ->willReturn(true);

        $this->assertTrue($this->handler->updateTimestamp('foo', 'session value'));
    }

    public function testValidateId()
    {
        $this->psr16->expects($this->once())
            ->method('get')
            ->with(self::PREFIX.'foo', '')
            ->willReturn('bar');

        $this->assertTrue($this->handler->validateId('foo'));
    }
}
