<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use Twig\Loader\ArrayLoader;
use Twig\Loader\ChainLoader;
use Twig\Loader\FilesystemLoader;
use Twig\Loader\LoaderInterface;

class Twig_Tests_Loader_ChainTest extends \PHPUnit\Framework\TestCase
{
    public function testGetSourceContext()
    {
        $path = __DIR__.'/../Fixtures';
        $loader = new ChainLoader([
            new ArrayLoader(['foo' => 'bar']),
            new ArrayLoader(['errors/index.html' => 'baz']),
            new FilesystemLoader([$path]),
        ]);

        $this->assertEquals('foo', $loader->getSourceContext('foo')->getName());
        $this->assertSame('', $loader->getSourceContext('foo')->getPath());

        $this->assertEquals('errors/index.html', $loader->getSourceContext('errors/index.html')->getName());
        $this->assertSame('', $loader->getSourceContext('errors/index.html')->getPath());
        $this->assertEquals('baz', $loader->getSourceContext('errors/index.html')->getCode());

        $this->assertEquals('errors/base.html', $loader->getSourceContext('errors/base.html')->getName());
        $this->assertEquals(realpath($path.'/errors/base.html'), realpath($loader->getSourceContext('errors/base.html')->getPath()));
        $this->assertNotEquals('baz', $loader->getSourceContext('errors/base.html')->getCode());
    }

    /**
     * @expectedException \Twig\Error\LoaderError
     */
    public function testGetSourceContextWhenTemplateDoesNotExist()
    {
        $loader = new ChainLoader([]);

        $loader->getSourceContext('foo');
    }

    public function testGetCacheKey()
    {
        $loader = new ChainLoader([
            new ArrayLoader(['foo' => 'bar']),
            new ArrayLoader(['foo' => 'foobar', 'bar' => 'foo']),
        ]);

        $this->assertEquals('foo:bar', $loader->getCacheKey('foo'));
        $this->assertEquals('bar:foo', $loader->getCacheKey('bar'));
    }

    /**
     * @expectedException \Twig\Error\LoaderError
     */
    public function testGetCacheKeyWhenTemplateDoesNotExist()
    {
        $loader = new ChainLoader([]);

        $loader->getCacheKey('foo');
    }

    public function testAddLoader()
    {
        $loader = new ChainLoader();
        $loader->addLoader(new ArrayLoader(['foo' => 'bar']));

        $this->assertEquals('bar', $loader->getSourceContext('foo')->getCode());
    }

    public function testExists()
    {
        $loader1 = $this->getMockBuilder(LoaderInterface::class)->getMock();
        $loader1->expects($this->once())->method('exists')->will($this->returnValue(false));
        $loader1->expects($this->never())->method('getSourceContext');

        $loader2 = $this->getMockBuilder(LoaderInterface::class)->getMock();
        $loader2->expects($this->once())->method('exists')->will($this->returnValue(true));
        $loader2->expects($this->never())->method('getSourceContext');

        $loader = new ChainLoader();
        $loader->addLoader($loader1);
        $loader->addLoader($loader2);

        $this->assertTrue($loader->exists('foo'));
    }
}
