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
use Symfony\Component\Config\Loader\DelegatingLoader;
use Symfony\Component\Config\Loader\LoaderResolver;

class DelegatingLoaderTest extends TestCase
{
    public function testConstructor()
    {
        $loader = new DelegatingLoader($resolver = new LoaderResolver());
        $this->assertTrue(true, '__construct() takes a loader resolver as its first argument');
    }

    public function testGetSetResolver()
    {
        $resolver = new LoaderResolver();
        $loader = new DelegatingLoader($resolver);
        $this->assertSame($resolver, $loader->getResolver(), '->getResolver() gets the resolver loader');
        $loader->setResolver($resolver = new LoaderResolver());
        $this->assertSame($resolver, $loader->getResolver(), '->setResolver() sets the resolver loader');
    }

    public function testSupports()
    {
        $loader1 = $this->getMockBuilder('Symfony\Component\Config\Loader\LoaderInterface')->getMock();
        $loader1->expects($this->once())->method('supports')->willReturn(true);
        $loader = new DelegatingLoader(new LoaderResolver([$loader1]));
        $this->assertTrue($loader->supports('foo.xml'), '->supports() returns true if the resource is loadable');

        $loader1 = $this->getMockBuilder('Symfony\Component\Config\Loader\LoaderInterface')->getMock();
        $loader1->expects($this->once())->method('supports')->willReturn(false);
        $loader = new DelegatingLoader(new LoaderResolver([$loader1]));
        $this->assertFalse($loader->supports('foo.foo'), '->supports() returns false if the resource is not loadable');
    }

    public function testLoad()
    {
        $loader = $this->getMockBuilder('Symfony\Component\Config\Loader\LoaderInterface')->getMock();
        $loader->expects($this->once())->method('supports')->willReturn(true);
        $loader->expects($this->once())->method('load');
        $resolver = new LoaderResolver([$loader]);
        $loader = new DelegatingLoader($resolver);

        $loader->load('foo');
    }

    /**
     * @expectedException \Symfony\Component\Config\Exception\LoaderLoadException
     */
    public function testLoadThrowsAnExceptionIfTheResourceCannotBeLoaded()
    {
        $loader = $this->getMockBuilder('Symfony\Component\Config\Loader\LoaderInterface')->getMock();
        $loader->expects($this->once())->method('supports')->willReturn(false);
        $resolver = new LoaderResolver([$loader]);
        $loader = new DelegatingLoader($resolver);

        $loader->load('foo');
    }
}
