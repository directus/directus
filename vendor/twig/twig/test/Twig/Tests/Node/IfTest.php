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
use Twig\Node\IfNode;
use Twig\Node\Node;
use Twig\Node\PrintNode;
use Twig\Test\NodeTestCase;

class Twig_Tests_Node_IfTest extends NodeTestCase
{
    public function testConstructor()
    {
        $t = new Node([
            new ConstantExpression(true, 1),
            new PrintNode(new NameExpression('foo', 1), 1),
        ], [], 1);
        $else = null;
        $node = new IfNode($t, $else, 1);

        $this->assertEquals($t, $node->getNode('tests'));
        $this->assertFalse($node->hasNode('else'));

        $else = new PrintNode(new NameExpression('bar', 1), 1);
        $node = new IfNode($t, $else, 1);
        $this->assertEquals($else, $node->getNode('else'));
    }

    public function getTests()
    {
        $tests = [];

        $t = new Node([
            new ConstantExpression(true, 1),
            new PrintNode(new NameExpression('foo', 1), 1),
        ], [], 1);
        $else = null;
        $node = new IfNode($t, $else, 1);

        $tests[] = [$node, <<<EOF
// line 1
if (true) {
    echo {$this->getVariableGetter('foo')};
}
EOF
        ];

        $t = new Node([
            new ConstantExpression(true, 1),
            new PrintNode(new NameExpression('foo', 1), 1),
            new ConstantExpression(false, 1),
            new PrintNode(new NameExpression('bar', 1), 1),
        ], [], 1);
        $else = null;
        $node = new IfNode($t, $else, 1);

        $tests[] = [$node, <<<EOF
// line 1
if (true) {
    echo {$this->getVariableGetter('foo')};
} elseif (false) {
    echo {$this->getVariableGetter('bar')};
}
EOF
        ];

        $t = new Node([
            new ConstantExpression(true, 1),
            new PrintNode(new NameExpression('foo', 1), 1),
        ], [], 1);
        $else = new PrintNode(new NameExpression('bar', 1), 1);
        $node = new IfNode($t, $else, 1);

        $tests[] = [$node, <<<EOF
// line 1
if (true) {
    echo {$this->getVariableGetter('foo')};
} else {
    echo {$this->getVariableGetter('bar')};
}
EOF
        ];

        return $tests;
    }
}
