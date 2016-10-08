<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_Node_SandboxedPrintTest extends Twig_Test_NodeTestCase
{
    public function testConstructor()
    {
        $node = new Twig_Node_SandboxedPrint($expr = new Twig_Node_Expression_Constant('foo', 1), 1);

        $this->assertEquals($expr, $node->getNode('expr'));
    }

    public function getTests()
    {
        $tests = array();

        $tests[] = array(new Twig_Node_SandboxedPrint(new Twig_Node_Expression_Constant('foo', 1), 1), <<<EOF
// line 1
echo \$this->env->getExtension('Twig_Extension_Sandbox')->ensureToStringAllowed("foo");
EOF
        );

        return $tests;
    }
}
