<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use Twig\Node\Expression\AssignNameExpression;
use Twig\Node\Expression\ConstantExpression;
use Twig\Node\Expression\NameExpression;
use Twig\Node\ForNode;
use Twig\Node\IfNode;
use Twig\Node\Node;
use Twig\Node\PrintNode;
use Twig\Test\NodeTestCase;

class Twig_Tests_Node_ForTest extends NodeTestCase
{
    public function testConstructor()
    {
        $keyTarget = new AssignNameExpression('key', 1);
        $valueTarget = new AssignNameExpression('item', 1);
        $seq = new NameExpression('items', 1);
        $ifexpr = new ConstantExpression(true, 1);
        $body = new Node([new PrintNode(new NameExpression('foo', 1), 1)], [], 1);
        $else = null;
        $node = new ForNode($keyTarget, $valueTarget, $seq, $ifexpr, $body, $else, 1);
        $node->setAttribute('with_loop', false);

        $this->assertEquals($keyTarget, $node->getNode('key_target'));
        $this->assertEquals($valueTarget, $node->getNode('value_target'));
        $this->assertEquals($seq, $node->getNode('seq'));
        $this->assertTrue($node->getAttribute('ifexpr'));
        $this->assertInstanceOf(IfNode::class, $node->getNode('body'));
        $this->assertEquals($body, $node->getNode('body')->getNode('tests')->getNode(1)->getNode(0));
        $this->assertFalse($node->hasNode('else'));

        $else = new PrintNode(new NameExpression('foo', 1), 1);
        $node = new ForNode($keyTarget, $valueTarget, $seq, $ifexpr, $body, $else, 1);
        $node->setAttribute('with_loop', false);
        $this->assertEquals($else, $node->getNode('else'));
    }

    public function getTests()
    {
        $tests = [];

        $keyTarget = new AssignNameExpression('key', 1);
        $valueTarget = new AssignNameExpression('item', 1);
        $seq = new NameExpression('items', 1);
        $ifexpr = null;
        $body = new Node([new PrintNode(new NameExpression('foo', 1), 1)], [], 1);
        $else = null;
        $node = new ForNode($keyTarget, $valueTarget, $seq, $ifexpr, $body, $else, 1);
        $node->setAttribute('with_loop', false);

        $tests[] = [$node, <<<EOF
// line 1
\$context['_parent'] = \$context;
\$context['_seq'] = twig_ensure_traversable({$this->getVariableGetter('items')});
foreach (\$context['_seq'] as \$context["key"] => \$context["item"]) {
    echo {$this->getVariableGetter('foo')};
}
\$_parent = \$context['_parent'];
unset(\$context['_seq'], \$context['_iterated'], \$context['key'], \$context['item'], \$context['_parent'], \$context['loop']);
\$context = array_intersect_key(\$context, \$_parent) + \$_parent;
EOF
        ];

        $keyTarget = new AssignNameExpression('k', 1);
        $valueTarget = new AssignNameExpression('v', 1);
        $seq = new NameExpression('values', 1);
        $ifexpr = null;
        $body = new Node([new PrintNode(new NameExpression('foo', 1), 1)], [], 1);
        $else = null;
        $node = new ForNode($keyTarget, $valueTarget, $seq, $ifexpr, $body, $else, 1);
        $node->setAttribute('with_loop', true);

        $tests[] = [$node, <<<EOF
// line 1
\$context['_parent'] = \$context;
\$context['_seq'] = twig_ensure_traversable({$this->getVariableGetter('values')});
\$context['loop'] = [
  'parent' => \$context['_parent'],
  'index0' => 0,
  'index'  => 1,
  'first'  => true,
];
if (is_array(\$context['_seq']) || (is_object(\$context['_seq']) && \$context['_seq'] instanceof \Countable)) {
    \$length = count(\$context['_seq']);
    \$context['loop']['revindex0'] = \$length - 1;
    \$context['loop']['revindex'] = \$length;
    \$context['loop']['length'] = \$length;
    \$context['loop']['last'] = 1 === \$length;
}
foreach (\$context['_seq'] as \$context["k"] => \$context["v"]) {
    echo {$this->getVariableGetter('foo')};
    ++\$context['loop']['index0'];
    ++\$context['loop']['index'];
    \$context['loop']['first'] = false;
    if (isset(\$context['loop']['length'])) {
        --\$context['loop']['revindex0'];
        --\$context['loop']['revindex'];
        \$context['loop']['last'] = 0 === \$context['loop']['revindex0'];
    }
}
\$_parent = \$context['_parent'];
unset(\$context['_seq'], \$context['_iterated'], \$context['k'], \$context['v'], \$context['_parent'], \$context['loop']);
\$context = array_intersect_key(\$context, \$_parent) + \$_parent;
EOF
        ];

        $keyTarget = new AssignNameExpression('k', 1);
        $valueTarget = new AssignNameExpression('v', 1);
        $seq = new NameExpression('values', 1);
        $ifexpr = new ConstantExpression(true, 1);
        $body = new Node([new PrintNode(new NameExpression('foo', 1), 1)], [], 1);
        $else = null;
        $node = new ForNode($keyTarget, $valueTarget, $seq, $ifexpr, $body, $else, 1);
        $node->setAttribute('with_loop', true);

        $tests[] = [$node, <<<EOF
// line 1
\$context['_parent'] = \$context;
\$context['_seq'] = twig_ensure_traversable({$this->getVariableGetter('values')});
\$context['loop'] = [
  'parent' => \$context['_parent'],
  'index0' => 0,
  'index'  => 1,
  'first'  => true,
];
foreach (\$context['_seq'] as \$context["k"] => \$context["v"]) {
    if (true) {
        echo {$this->getVariableGetter('foo')};
        ++\$context['loop']['index0'];
        ++\$context['loop']['index'];
        \$context['loop']['first'] = false;
    }
}
\$_parent = \$context['_parent'];
unset(\$context['_seq'], \$context['_iterated'], \$context['k'], \$context['v'], \$context['_parent'], \$context['loop']);
\$context = array_intersect_key(\$context, \$_parent) + \$_parent;
EOF
        ];

        $keyTarget = new AssignNameExpression('k', 1);
        $valueTarget = new AssignNameExpression('v', 1);
        $seq = new NameExpression('values', 1);
        $ifexpr = null;
        $body = new Node([new PrintNode(new NameExpression('foo', 1), 1)], [], 1);
        $else = new PrintNode(new NameExpression('foo', 1), 1);
        $node = new ForNode($keyTarget, $valueTarget, $seq, $ifexpr, $body, $else, 1);
        $node->setAttribute('with_loop', true);

        $tests[] = [$node, <<<EOF
// line 1
\$context['_parent'] = \$context;
\$context['_seq'] = twig_ensure_traversable({$this->getVariableGetter('values')});
\$context['_iterated'] = false;
\$context['loop'] = [
  'parent' => \$context['_parent'],
  'index0' => 0,
  'index'  => 1,
  'first'  => true,
];
if (is_array(\$context['_seq']) || (is_object(\$context['_seq']) && \$context['_seq'] instanceof \Countable)) {
    \$length = count(\$context['_seq']);
    \$context['loop']['revindex0'] = \$length - 1;
    \$context['loop']['revindex'] = \$length;
    \$context['loop']['length'] = \$length;
    \$context['loop']['last'] = 1 === \$length;
}
foreach (\$context['_seq'] as \$context["k"] => \$context["v"]) {
    echo {$this->getVariableGetter('foo')};
    \$context['_iterated'] = true;
    ++\$context['loop']['index0'];
    ++\$context['loop']['index'];
    \$context['loop']['first'] = false;
    if (isset(\$context['loop']['length'])) {
        --\$context['loop']['revindex0'];
        --\$context['loop']['revindex'];
        \$context['loop']['last'] = 0 === \$context['loop']['revindex0'];
    }
}
if (!\$context['_iterated']) {
    echo {$this->getVariableGetter('foo')};
}
\$_parent = \$context['_parent'];
unset(\$context['_seq'], \$context['_iterated'], \$context['k'], \$context['v'], \$context['_parent'], \$context['loop']);
\$context = array_intersect_key(\$context, \$_parent) + \$_parent;
EOF
        ];

        return $tests;
    }
}
