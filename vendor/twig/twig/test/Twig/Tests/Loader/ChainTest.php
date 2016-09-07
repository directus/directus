<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_Loader_ChainTest extends PHPUnit_Framework_TestCase
{
    public function testGetSource()
    {
        $loader = new Twig_Loader_Chain(array(
            new Twig_Loader_Array(array('foo' => 'bar')),
            new Twig_Loader_Array(array('foo' => 'foobar', 'bar' => 'foo')),
        ));

        $this->assertEquals('bar', $loader->getSource('foo'));
        $this->assertEquals('foo', $loader->getSource('bar'));
    }

    /**
     * @expectedException Twig_Error_Loader
     */
    public function testGetSourceWhenTemplateDoesNotExist()
    {
        $loader = new Twig_Loader_Chain(array());

        $loader->getSource('foo');
    }

    public function testGetCacheKey()
    {
        $loader = new Twig_Loader_Chain(array(
            new Twig_Loader_Array(array('foo' => 'bar')),
            new Twig_Loader_Array(array('foo' => 'foobar', 'bar' => 'foo')),
        ));

        $this->assertEquals('bar', $loader->getCacheKey('foo'));
        $this->assertEquals('foo', $loader->getCacheKey('bar'));
    }

    /**
     * @expectedException Twig_Error_Loader
     */
    public function testGetCacheKeyWhenTemplateDoesNotExist()
    {
        $loader = new Twig_Loader_Chain(array());

        $loader->getCacheKey('foo');
    }

    public function testAddLoader()
    {
        $loader = new Twig_Loader_Chain();
        $loader->addLoader(new Twig_Loader_Array(array('foo' => 'bar')));

        $this->assertEquals('bar', $loader->getSource('foo'));
    }

    public function testExists()
    {
        $loader1 = $this->getMockBuilder('Twig_Loader_Array')->setMethods(array('exists', 'getSource'))->disableOriginalConstructor()->getMock();
        $loader1->expects($this->once())->method('exists')->will($this->returnValue(false));
        $loader1->expects($this->never())->method('getSource');

        $loader2 = $this->getMockBuilder('Twig_LoaderInterface')->getMock();
        $loader2->expects($this->once())->method('getSource')->will($this->returnValue('content'));

        $loader = new Twig_Loader_Chain();
        $loader->addLoader($loader1);
        $loader->addLoader($loader2);

        $this->assertTrue($loader->exists('foo'));
    }
}
