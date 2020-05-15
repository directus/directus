<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Bridge\SimpleCache\Tests;

use Cache\Bridge\SimpleCache\SimpleCacheBridge;
use Mockery as m;
use PHPUnit\Framework\TestCase;
use Psr\Cache\CacheItemInterface;
use Psr\Cache\CacheItemPoolInterface;

class SimpleCacheBridgeTest extends TestCase
{
    /**
     * @type SimpleCacheBridge
     */
    private $bridge;

    /**
     * @type m\MockInterface|CacheItemPoolInterface
     */
    private $mock;

    /**
     * @type m\MockInterface|CacheItemInterface
     */
    private $itemMock;

    protected function setUp()
    {
        parent::setUp();

        $this->mock = m::mock(CacheItemPoolInterface::class);

        $this->bridge = new SimpleCacheBridge($this->mock);

        $this->itemMock = m::mock(CacheItemInterface::class);
    }

    public function testConstructor()
    {
        $this->assertInstanceOf(SimpleCacheBridge::class, $this->bridge);
    }

    public function testFetch()
    {
        $this->itemMock->shouldReceive('isHit')->times(1)->andReturn(true);
        $this->itemMock->shouldReceive('get')->times(1)->andReturn('some_value');

        $this->mock->shouldReceive('getItem')->withArgs(['some_item'])->andReturn($this->itemMock);

        $this->assertEquals('some_value', $this->bridge->get('some_item'));
    }

    public function testFetchMiss()
    {
        $this->itemMock->shouldReceive('isHit')->times(1)->andReturn(false);

        $this->mock->shouldReceive('getItem')->withArgs(['no_item'])->andReturn($this->itemMock);

        $this->assertFalse($this->bridge->get('no_item', false));
    }

    public function testContains()
    {
        $this->mock->shouldReceive('hasItem')->withArgs(['no_item'])->andReturn(false);
        $this->mock->shouldReceive('hasItem')->withArgs(['some_item'])->andReturn(true);

        $this->assertFalse($this->bridge->has('no_item'));
        $this->assertTrue($this->bridge->has('some_item'));
    }

    public function testSave()
    {
        $this->itemMock->shouldReceive('set')->twice()->with('dummy_data');
        $this->itemMock->shouldReceive('expiresAfter')->once()->with(null);
        $this->itemMock->shouldReceive('expiresAfter')->once()->with(2);
        $this->mock->shouldReceive('getItem')->twice()->with('some_item')->andReturn($this->itemMock);
        $this->mock->shouldReceive('save')->twice()->with($this->itemMock)->andReturn(true);

        $this->assertTrue($this->bridge->set('some_item', 'dummy_data'));
        $this->assertTrue($this->bridge->set('some_item', 'dummy_data', 2));
    }

    public function testDelete()
    {
        $this->mock->shouldReceive('deleteItem')->once()->with('some_item')->andReturn(true);

        $this->assertTrue($this->bridge->delete('some_item'));
    }
}
