<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_Node_ImportTest extends Twig_Test_NodeTestCase
{
    public function testConstructor()
    {
        $macro = new Twig_Node_Expression_Constant('foo.twig', 1);
        $var = new Twig_Node_Expression_AssignName('macro', 1);
        $node = new Twig_Node_Import($macro, $var, 1);

        $this->assertEquals($macro, $node->getNode('expr'));
        $this->assertEquals($var, $node->getNode('var'));
    }

    public function getTests()
    {
        $tests = [];

        $macro = new Twig_Node_Expression_Constant('foo.twig', 1);
        $var = new Twig_Node_Expression_AssignName('macro', 1);
        $node = new Twig_Node_Import($macro, $var, 1);

        $tests[] = [$node, <<<EOF
// line 1
\$context["macro"] = \$this->loadTemplate("foo.twig", null, 1);
EOF
        ];

        return $tests;
    }
}
