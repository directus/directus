<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_Node_Expression_ArrayTest extends Twig_Test_NodeTestCase
{
    public function testConstructor()
    {
        $elements = array(new Twig_Node_Expression_Constant('foo', 1), $foo = new Twig_Node_Expression_Constant('bar', 1));
        $node = new Twig_Node_Expression_Array($elements, 1);

        $this->assertEquals($foo, $node->getNode(1));
    }

    public function getTests()
    {
        $elements = array(
            new Twig_Node_Expression_Constant('foo', 1),
            new Twig_Node_Expression_Constant('bar', 1),

            new Twig_Node_Expression_Constant('bar', 1),
            new Twig_Node_Expression_Constant('foo', 1),
        );
        $node = new Twig_Node_Expression_Array($elements, 1);

        return array(
            array($node, 'array("foo" => "bar", "bar" => "foo")'),
        );
    }
}
