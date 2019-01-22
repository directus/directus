<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
class Twig_Tests_TemplateWrapperTest extends \PHPUnit\Framework\TestCase
{
    public function testHasGetBlocks()
    {
        $twig = new Twig_Environment(new Twig_Loader_Array([
            'index' => '{% block foo %}{% endblock %}',
            'index_with_use' => '{% use "imported" %}{% block foo %}{% endblock %}',
            'index_with_extends' => '{% extends "extended" %}{% block foo %}{% endblock %}',
            'imported' => '{% block imported %}{% endblock %}',
            'extended' => '{% block extended %}{% endblock %}',
        ]));

        $wrapper = new Twig_TemplateWrapper($twig, $twig->loadTemplate('index'));
        $this->assertTrue($wrapper->hasBlock('foo'));
        $this->assertFalse($wrapper->hasBlock('bar'));
        $this->assertEquals(['foo'], $wrapper->getBlockNames());

        $wrapper = new Twig_TemplateWrapper($twig, $twig->loadTemplate('index_with_use'));
        $this->assertTrue($wrapper->hasBlock('foo'));
        $this->assertTrue($wrapper->hasBlock('imported'));
        $this->assertEquals(['imported', 'foo'], $wrapper->getBlockNames());

        $wrapper = new Twig_TemplateWrapper($twig, $twig->loadTemplate('index_with_extends'));
        $this->assertTrue($wrapper->hasBlock('foo'));
        $this->assertTrue($wrapper->hasBlock('extended'));
        $this->assertEquals(['foo', 'extended'], $wrapper->getBlockNames());
    }

    public function testRenderBlock()
    {
        $twig = new Twig_Environment(new Twig_Loader_Array([
            'index' => '{% block foo %}{{ foo }}{{ bar }}{% endblock %}',
        ]));
        $twig->addGlobal('bar', 'BAR');

        $wrapper = new Twig_TemplateWrapper($twig, $twig->loadTemplate('index'));
        $this->assertEquals('FOOBAR', $wrapper->renderBlock('foo', ['foo' => 'FOO']));
    }

    public function testDisplayBlock()
    {
        $twig = new Twig_Environment(new Twig_Loader_Array([
            'index' => '{% block foo %}{{ foo }}{{ bar }}{% endblock %}',
        ]));
        $twig->addGlobal('bar', 'BAR');

        $wrapper = new Twig_TemplateWrapper($twig, $twig->loadTemplate('index'));

        ob_start();
        $wrapper->displayBlock('foo', ['foo' => 'FOO']);

        $this->assertEquals('FOOBAR', ob_get_clean());
    }
}
