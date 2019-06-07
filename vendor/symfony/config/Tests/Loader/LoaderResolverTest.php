<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Config\Tests\Loader;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Config\Loader\LoaderResolver;

class LoaderResolverTest extends TestCase
{
    public function testConstructor()
    {
        $resolver = new LoaderResolver([
            $loader = $this->getMockBuilder('Symfony\Component\Config\Loader\LoaderInterface')->getMock(),
        ]);

        $this->assertEquals([$loader], $resolver->getLoaders(), '__construct() takes an array of loaders as its first argument');
    }

    public function testResolve()
    {
        $loader = $this->getMockBuilder('Symfony\Component\Config\Loader\LoaderInterface')->getMock();
        $resolver = new LoaderResolver([$loader]);
        $this->assertFalse($resolver->resolve('foo.foo'), '->resolve() returns false if no loader is able to load the resource');

        $loader = $this->getMockBuilder('Symfony\Component\Config\Loader\LoaderInterface')->getMock();
        $loader->expects($this->once())->method('supports')->willReturn(true);
        $resolver = new LoaderResolver([$loader]);
        $this->assertEquals($loader, $resolver->resolve(function () {}), '->resolve() returns the loader for the given resource');
    }

    public function testLoaders()
    {
        $resolver = new LoaderResolver();
        $resolver->addLoader($loader = $this->getMockBuilder('Symfony\Component\Config\Loader\LoaderInterface')->getMock());

        $this->assertEquals([$loader], $resolver->getLoaders(), 'addLoader() adds a loader');
    }
}
