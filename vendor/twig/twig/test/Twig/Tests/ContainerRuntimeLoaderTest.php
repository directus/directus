<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use Psr\Container\ContainerInterface;

class Twig_Tests_ContainerRuntimeLoaderTest extends \PHPUnit\Framework\TestCase
{
    public function testLoad()
    {
        $container = $this->getMockBuilder(ContainerInterface::class)->getMock();
        $container->expects($this->once())->method('has')->with('stdClass')->willReturn(true);
        $container->expects($this->once())->method('get')->with('stdClass')->willReturn(new \stdClass());

        $loader = new Twig_ContainerRuntimeLoader($container);

        $this->assertInstanceOf('stdClass', $loader->load('stdClass'));
    }

    public function testLoadUnknownRuntimeReturnsNull()
    {
        $container = $this->getMockBuilder(ContainerInterface::class)->getMock();
        $container->expects($this->once())->method('has')->with('Foo');
        $container->expects($this->never())->method('get');

        $this->assertNull((new Twig_ContainerRuntimeLoader($container))->load('Foo'));
    }
}
