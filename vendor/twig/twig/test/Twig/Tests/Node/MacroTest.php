<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_Node_MacroTest extends Twig_Test_NodeTestCase
{
    public function testConstructor()
    {
        $body = new Twig_Node_Text('foo', 1);
        $arguments = new Twig_Node(array(new Twig_Node_Expression_Name('foo', 1)), array(), 1);
        $node = new Twig_Node_Macro('foo', $body, $arguments, 1);

        $this->assertEquals($body, $node->getNode('body'));
        $this->assertEquals($arguments, $node->getNode('arguments'));
        $this->assertEquals('foo', $node->getAttribute('name'));
    }

    public function getTests()
    {
        $body = new Twig_Node_Text('foo', 1);
        $arguments = new Twig_Node(array(
            'foo' => new Twig_Node_Expression_Constant(null, 1),
            'bar' => new Twig_Node_Expression_Constant('Foo', 1),
        ), array(), 1);
        $node = new Twig_Node_Macro('foo', $body, $arguments, 1);

        return array(
            array($node, <<<EOF
// line 1
public function macro_foo(\$__foo__ = null, \$__bar__ = "Foo", ...\$__varargs__)
{
    \$context = \$this->env->mergeGlobals(array(
        "foo" => \$__foo__,
        "bar" => \$__bar__,
        "varargs" => \$__varargs__,
    ));

    \$blocks = array();

    ob_start();
    try {
        echo "foo";

        return ('' === \$tmp = ob_get_contents()) ? '' : new Twig_Markup(\$tmp, \$this->env->getCharset());
    } finally {
        ob_end_clean();
    }
}
EOF
            ),
        );
    }
}
