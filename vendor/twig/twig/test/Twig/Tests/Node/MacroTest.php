<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use Twig\Node\Expression\ConstantExpression;
use Twig\Node\Expression\NameExpression;
use Twig\Node\MacroNode;
use Twig\Node\Node;
use Twig\Node\TextNode;
use Twig\Test\NodeTestCase;

class Twig_Tests_Node_MacroTest extends NodeTestCase
{
    public function testConstructor()
    {
        $body = new TextNode('foo', 1);
        $arguments = new Node([new NameExpression('foo', 1)], [], 1);
        $node = new MacroNode('foo', $body, $arguments, 1);

        $this->assertEquals($body, $node->getNode('body'));
        $this->assertEquals($arguments, $node->getNode('arguments'));
        $this->assertEquals('foo', $node->getAttribute('name'));
    }

    public function getTests()
    {
        $body = new TextNode('foo', 1);
        $arguments = new Node([
            'foo' => new ConstantExpression(null, 1),
            'bar' => new ConstantExpression('Foo', 1),
        ], [], 1);
        $node = new MacroNode('foo', $body, $arguments, 1);

        return [
            [$node, <<<EOF
// line 1
public function macro_foo(\$__foo__ = null, \$__bar__ = "Foo", ...\$__varargs__)
{
    \$context = \$this->env->mergeGlobals([
        "foo" => \$__foo__,
        "bar" => \$__bar__,
        "varargs" => \$__varargs__,
    ]);

    \$blocks = [];

    ob_start();
    try {
        echo "foo";

        return ('' === \$tmp = ob_get_contents()) ? '' : new Markup(\$tmp, \$this->env->getCharset());
    } finally {
        ob_end_clean();
    }
}
EOF
            ],
        ];
    }
}
