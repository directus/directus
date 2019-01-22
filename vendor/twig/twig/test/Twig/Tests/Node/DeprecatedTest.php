<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_Node_DeprecatedTest extends Twig_Test_NodeTestCase
{
    public function testConstructor()
    {
        $expr = new Twig_Node_Expression_Constant('foo', 1);
        $node = new Twig_Node_Deprecated($expr, 1);

        $this->assertEquals($expr, $node->getNode('expr'));
    }

    public function getTests()
    {
        $tests = [];

        $expr = new Twig_Node_Expression_Constant('This section is deprecated', 1);
        $node = new Twig_Node_Deprecated($expr, 1, 'deprecated');
        $node->setTemplateName('foo.twig');

        $tests[] = [$node, <<<EOF
// line 1
@trigger_error("This section is deprecated"." (\"foo.twig\" at line 1).", E_USER_DEPRECATED);
EOF
        ];

        $t = new Twig_Node([
            new Twig_Node_Expression_Constant(true, 1),
            new Twig_Node_Deprecated($expr, 2, 'deprecated'),
        ], [], 1);
        $node = new Twig_Node_If($t, null, 1);
        $node->setTemplateName('foo.twig');

        $tests[] = [$node, <<<EOF
// line 1
if (true) {
    // line 2
    @trigger_error("This section is deprecated"." (\"foo.twig\" at line 2).", E_USER_DEPRECATED);
}
EOF
        ];

        $environment = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());
        $environment->addFunction(new Twig_SimpleFunction('foo', 'foo', []));

        $expr = new Twig_Node_Expression_Function('foo', new Twig_Node(), 1);
        $node = new Twig_Node_Deprecated($expr, 1, 'deprecated');
        $node->setTemplateName('foo.twig');

        $compiler = $this->getCompiler($environment);
        $varName = $compiler->getVarName();

        $tests[] = [$node, <<<EOF
// line 1
\$$varName = foo();
@trigger_error(\$$varName." (\"foo.twig\" at line 1).", E_USER_DEPRECATED);
EOF
        , $environment];

        return $tests;
    }
}
