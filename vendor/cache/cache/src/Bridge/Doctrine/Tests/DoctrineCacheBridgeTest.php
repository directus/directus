<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Bridge\Doctrine\Tests;

use Cache\Bridge\Doctrine\DoctrineCacheBridge;
use Mockery as m;
use PHPUnit\Framework\TestCase;
use Psr\Cache\CacheItemInterface;
use Psr\Cache\CacheItemPoolInterface;

/**
 * @author Aaron Scherer <aequasi@gmail.com>
 */
class DoctrineCacheBridgeTest extends TestCase
{
    /**
     * @type DoctrineCacheBridge
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

        $itemMock = m::mock(CacheItemInterface::class);
        $itemMock->shouldReceive('isHit')->andReturn(false);
        $this->mock->shouldReceive('getItem')->withArgs(['DoctrineNamespaceCacheKey[]'])->andReturn($itemMock);

        $this->bridge = new DoctrineCacheBridge($this->mock);

        $this->itemMock = m::mock(CacheItemInterface::class);
    }

    public function testConstructor()
    {
        $this->assertInstanceOf(DoctrineCacheBridge::class, $this->bridge);
    }

    public function testFetch()
    {
        $this->itemMock->shouldReceive('isHit')->times(1)->andReturn(true);
        $this->itemMock->shouldReceive('get')->times(1)->andReturn('some_value');

        $this->mock->shouldReceive('getItem')->withArgs(['[some_item][1]'])->andReturn($this->itemMock);

        $this->assertEquals('some_value', $this->bridge->fetch('some_item'));
    }

    public function testFetchMiss()
    {
        $this->itemMock->shouldReceive('isHit')->times(1)->andReturn(false);

        $this->mock->shouldReceive('getItem')->withArgs(['[no_item][1]'])->andReturn($this->itemMock);

        $this->assertFalse($this->bridge->fetch('no_item'));
    }

    public function testContains()
    {
        $this->mock->shouldReceive('hasItem')->withArgs(['[no_item][1]'])->andReturn(false);
        $this->mock->shouldReceive('hasItem')->withArgs(['[some_item][1]'])->andReturn(true);

        $this->assertFalse($this->bridge->contains('no_item'));
        $this->assertTrue($this->bridge->contains('some_item'));
    }

    public function testSave()
    {
        $this->itemMock->shouldReceive('set')->twice()->with('dummy_data');
        $this->itemMock->shouldReceive('expiresAfter')->once()->with(2);
        $this->mock->shouldReceive('getItem')->twice()->with('[some_item][1]')->andReturn($this->itemMock);
        $this->mock->shouldReceive('save')->twice()->with($this->itemMock)->andReturn(true);

        $this->assertTrue($this->bridge->save('some_item', 'dummy_data'));
        $this->assertTrue($this->bridge->save('some_item', 'dummy_data', 2));
    }

    public function testDelete()
    {
        $this->mock->shouldReceive('deleteItem')->once()->with('[some_item][1]')->andReturn(true);

        $this->assertTrue($this->bridge->delete('some_item'));
    }

    public function testGetCache()
    {
        $this->assertInstanceOf(CacheItemPoolInterface::class, $this->bridge->getCachePool());
    }

    public function testGetStats()
    {
        $this->assertEmpty($this->bridge->getStats());
    }

    /**
     * @param string $key
     * @dataProvider invalidKeys
     */
    public function testInvalidKeys($key, $normalizedKey)
    {
        $normalizedKey = sprintf('[%s][1]', $normalizedKey);
        $this->itemMock->shouldReceive('isHit')->andReturn(false);
        $this->itemMock->shouldReceive('set');

        $this->mock->shouldReceive('getItem')->withArgs([$normalizedKey])->andReturn($this->itemMock);
        $this->mock->shouldReceive('hasItem')->withArgs([$normalizedKey])->andReturn(false);
        $this->mock->shouldReceive('deleteItem')->withArgs([$normalizedKey]);
        $this->mock->shouldReceive('save');

        $this->bridge->contains($key);
        $this->bridge->save($key, 'foo');
        $this->bridge->fetch($key);
        $this->bridge->delete($key);
    }

    /**
     * Data provider for invalid keys.
     *
     * @return array
     */
    public static function invalidKeys()
    {
        return [
            ['{str', '_str'],
            ['rand{', 'rand_'],
            ['rand{str', 'rand_str'],
            ['rand}str', 'rand_str'],
            ['rand(str', 'rand_str'],
            ['rand)str', 'rand_str'],
            ['rand/str', 'rand_str'],
            ['rand\\str', 'rand_str'],
            ['rand@str', 'rand_str'],
            ['rand:str', 'rand_str'],
        ];
    }
}
