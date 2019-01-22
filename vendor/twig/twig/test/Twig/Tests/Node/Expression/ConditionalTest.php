<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_Node_Expression_ConditionalTest extends Twig_Test_NodeTestCase
{
    public function testConstructor()
    {
        $expr1 = new Twig_Node_Expression_Constant(1, 1);
        $expr2 = new Twig_Node_Expression_Constant(2, 1);
        $expr3 = new Twig_Node_Expression_Constant(3, 1);
        $node = new Twig_Node_Expression_Conditional($expr1, $expr2, $expr3, 1);

        $this->assertEquals($expr1, $node->getNode('expr1'));
        $this->assertEquals($expr2, $node->getNode('expr2'));
        $this->assertEquals($expr3, $node->getNode('expr3'));
    }

    public function getTests()
    {
        $tests = [];

        $expr1 = new Twig_Node_Expression_Constant(1, 1);
        $expr2 = new Twig_Node_Expression_Constant(2, 1);
        $expr3 = new Twig_Node_Expression_Constant(3, 1);
        $node = new Twig_Node_Expression_Conditional($expr1, $expr2, $expr3, 1);
        $tests[] = [$node, '((1) ? (2) : (3))'];

        return $tests;
    }
}
