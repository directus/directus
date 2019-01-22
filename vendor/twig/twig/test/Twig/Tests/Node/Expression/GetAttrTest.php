<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_Node_Expression_GetAttrTest extends Twig_Test_NodeTestCase
{
    public function testConstructor()
    {
        $expr = new Twig_Node_Expression_Name('foo', 1);
        $attr = new Twig_Node_Expression_Constant('bar', 1);
        $args = new Twig_Node_Expression_Array([], 1);
        $args->addElement(new Twig_Node_Expression_Name('foo', 1));
        $args->addElement(new Twig_Node_Expression_Constant('bar', 1));
        $node = new Twig_Node_Expression_GetAttr($expr, $attr, $args, Twig_Template::ARRAY_CALL, 1);

        $this->assertEquals($expr, $node->getNode('node'));
        $this->assertEquals($attr, $node->getNode('attribute'));
        $this->assertEquals($args, $node->getNode('arguments'));
        $this->assertEquals(Twig_Template::ARRAY_CALL, $node->getAttribute('type'));
    }

    public function getTests()
    {
        $tests = [];

        $expr = new Twig_Node_Expression_Name('foo', 1);
        $attr = new Twig_Node_Expression_Constant('bar', 1);
        $args = new Twig_Node_Expression_Array([], 1);
        $node = new Twig_Node_Expression_GetAttr($expr, $attr, $args, Twig_Template::ANY_CALL, 1);
        $tests[] = [$node, sprintf('%s%s, "bar", [])', $this->getAttributeGetter(), $this->getVariableGetter('foo', 1))];

        $node = new Twig_Node_Expression_GetAttr($expr, $attr, $args, Twig_Template::ARRAY_CALL, 1);
        $tests[] = [$node, '(($__internal_%s = // line 1'."\n".
            '($context["foo"] ?? null)) && is_array($__internal_%s) || $__internal_%s instanceof ArrayAccess ? ($__internal_%s["bar"] ?? null) : null)', null, true, ];

        $args = new Twig_Node_Expression_Array([], 1);
        $args->addElement(new Twig_Node_Expression_Name('foo', 1));
        $args->addElement(new Twig_Node_Expression_Constant('bar', 1));
        $node = new Twig_Node_Expression_GetAttr($expr, $attr, $args, Twig_Template::METHOD_CALL, 1);
        $tests[] = [$node, sprintf('%s%s, "bar", [0 => %s, 1 => "bar"], "method")', $this->getAttributeGetter(), $this->getVariableGetter('foo', 1), $this->getVariableGetter('foo'))];

        return $tests;
    }
}
