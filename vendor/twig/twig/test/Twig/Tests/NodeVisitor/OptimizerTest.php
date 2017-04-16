<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
class Twig_Tests_NodeVisitor_OptimizerTest extends PHPUnit_Framework_TestCase
{
    public function testRenderBlockOptimizer()
    {
        $env = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock(), array('cache' => false, 'autoescape' => false));

        $stream = $env->parse($env->tokenize(new Twig_Source('{{ block("foo") }}', 'index')));

        $node = $stream->getNode('body')->getNode(0);

        $this->assertEquals('Twig_Node_Expression_BlockReference', get_class($node));
        $this->assertTrue($node->getAttribute('output'));
    }

    public function testRenderParentBlockOptimizer()
    {
        $env = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock(), array('cache' => false, 'autoescape' => false));

        $stream = $env->parse($env->tokenize(new Twig_Source('{% extends "foo" %}{% block content %}{{ parent() }}{% endblock %}', 'index')));

        $node = $stream->getNode('blocks')->getNode('content')->getNode(0)->getNode('body');

        $this->assertEquals('Twig_Node_Expression_Parent', get_class($node));
        $this->assertTrue($node->getAttribute('output'));
    }

    public function testRenderVariableBlockOptimizer()
    {
        if (PHP_VERSION_ID >= 50400) {
            $this->markTestSkipped('not needed on PHP >= 5.4');
        }

        $env = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock(), array('cache' => false, 'autoescape' => false));
        $stream = $env->parse($env->tokenize(new Twig_Source('{{ block(name|lower) }}', 'index')));

        $node = $stream->getNode('body')->getNode(0)->getNode(1);

        $this->assertEquals('Twig_Node_Expression_BlockReference', get_class($node));
        $this->assertTrue($node->getAttribute('output'));
    }

    /**
     * @dataProvider getTestsForForOptimizer
     */
    public function testForOptimizer($template, $expected)
    {
        $env = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock(), array('cache' => false));

        $stream = $env->parse($env->tokenize(new Twig_Source($template, 'index')));

        foreach ($expected as $target => $withLoop) {
            $this->assertTrue($this->checkForConfiguration($stream, $target, $withLoop), sprintf('variable %s is %soptimized', $target, $withLoop ? 'not ' : ''));
        }
    }

    public function getTestsForForOptimizer()
    {
        return array(
            array('{% for i in foo %}{% endfor %}', array('i' => false)),

            array('{% for i in foo %}{{ loop.index }}{% endfor %}', array('i' => true)),

            array('{% for i in foo %}{% for j in foo %}{% endfor %}{% endfor %}', array('i' => false, 'j' => false)),

            array('{% for i in foo %}{% include "foo" %}{% endfor %}', array('i' => true)),

            array('{% for i in foo %}{% include "foo" only %}{% endfor %}', array('i' => false)),

            array('{% for i in foo %}{% include "foo" with { "foo": "bar" } only %}{% endfor %}', array('i' => false)),

            array('{% for i in foo %}{% include "foo" with { "foo": loop.index } only %}{% endfor %}', array('i' => true)),

            array('{% for i in foo %}{% for j in foo %}{{ loop.index }}{% endfor %}{% endfor %}', array('i' => false, 'j' => true)),

            array('{% for i in foo %}{% for j in foo %}{{ loop.parent.loop.index }}{% endfor %}{% endfor %}', array('i' => true, 'j' => true)),

            array('{% for i in foo %}{% set l = loop %}{% for j in foo %}{{ l.index }}{% endfor %}{% endfor %}', array('i' => true, 'j' => false)),

            array('{% for i in foo %}{% for j in foo %}{{ foo.parent.loop.index }}{% endfor %}{% endfor %}', array('i' => false, 'j' => false)),

            array('{% for i in foo %}{% for j in foo %}{{ loop["parent"].loop.index }}{% endfor %}{% endfor %}', array('i' => true, 'j' => true)),

            array('{% for i in foo %}{{ include("foo") }}{% endfor %}', array('i' => true)),

            array('{% for i in foo %}{{ include("foo", with_context = false) }}{% endfor %}', array('i' => false)),

            array('{% for i in foo %}{{ include("foo", with_context = true) }}{% endfor %}', array('i' => true)),

            array('{% for i in foo %}{{ include("foo", { "foo": "bar" }, with_context = false) }}{% endfor %}', array('i' => false)),

            array('{% for i in foo %}{{ include("foo", { "foo": loop.index }, with_context = false) }}{% endfor %}', array('i' => true)),
        );
    }

    public function checkForConfiguration(Twig_NodeInterface $node = null, $target, $withLoop)
    {
        if (null === $node) {
            return;
        }

        foreach ($node as $n) {
            if ($n instanceof Twig_Node_For) {
                if ($target === $n->getNode('value_target')->getAttribute('name')) {
                    return $withLoop == $n->getAttribute('with_loop');
                }
            }

            $ret = $this->checkForConfiguration($n, $target, $withLoop);
            if (null !== $ret) {
                return $ret;
            }
        }
    }
}
