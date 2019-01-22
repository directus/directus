<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_Node_DoTest extends Twig_Test_NodeTestCase
{
    public function testConstructor()
    {
        $expr = new Twig_Node_Expression_Constant('foo', 1);
        $node = new Twig_Node_Do($expr, 1);

        $this->assertEquals($expr, $node->getNode('expr'));
    }

    public function getTests()
    {
        $tests = [];

        $expr = new Twig_Node_Expression_Constant('foo', 1);
        $node = new Twig_Node_Do($expr, 1);
        $tests[] = [$node, "// line 1\n\"foo\";"];

        return $tests;
    }
}
