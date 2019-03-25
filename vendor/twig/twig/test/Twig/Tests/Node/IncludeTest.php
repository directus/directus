<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use Twig\Node\Expression\ArrayExpression;
use Twig\Node\Expression\ConditionalExpression;
use Twig\Node\Expression\ConstantExpression;
use Twig\Node\IncludeNode;
use Twig\Test\NodeTestCase;

class Twig_Tests_Node_IncludeTest extends NodeTestCase
{
    public function testConstructor()
    {
        $expr = new ConstantExpression('foo.twig', 1);
        $node = new IncludeNode($expr, null, false, false, 1);

        $this->assertFalse($node->hasNode('variables'));
        $this->assertEquals($expr, $node->getNode('expr'));
        $this->assertFalse($node->getAttribute('only'));

        $vars = new ArrayExpression([new ConstantExpression('foo', 1), new ConstantExpression(true, 1)], 1);
        $node = new IncludeNode($expr, $vars, true, false, 1);
        $this->assertEquals($vars, $node->getNode('variables'));
        $this->assertTrue($node->getAttribute('only'));
    }

    public function getTests()
    {
        $tests = [];

        $expr = new ConstantExpression('foo.twig', 1);
        $node = new IncludeNode($expr, null, false, false, 1);
        $tests[] = [$node, <<<EOF
// line 1
\$this->loadTemplate("foo.twig", null, 1)->display(\$context);
EOF
        ];

        $expr = new ConditionalExpression(
                        new ConstantExpression(true, 1),
                        new ConstantExpression('foo', 1),
                        new ConstantExpression('foo', 1),
                        0
                    );
        $node = new IncludeNode($expr, null, false, false, 1);
        $tests[] = [$node, <<<EOF
// line 1
\$this->loadTemplate(((true) ? ("foo") : ("foo")), null, 1)->display(\$context);
EOF
        ];

        $expr = new ConstantExpression('foo.twig', 1);
        $vars = new ArrayExpression([new ConstantExpression('foo', 1), new ConstantExpression(true, 1)], 1);
        $node = new IncludeNode($expr, $vars, false, false, 1);
        $tests[] = [$node, <<<EOF
// line 1
\$this->loadTemplate("foo.twig", null, 1)->display(twig_array_merge(\$context, ["foo" => true]));
EOF
        ];

        $node = new IncludeNode($expr, $vars, true, false, 1);
        $tests[] = [$node, <<<EOF
// line 1
\$this->loadTemplate("foo.twig", null, 1)->display(twig_to_array(["foo" => true]));
EOF
        ];

        $node = new IncludeNode($expr, $vars, true, true, 1);
        $tests[] = [$node, <<<EOF
// line 1
try {
    \$this->loadTemplate("foo.twig", null, 1)->display(twig_to_array(["foo" => true]));
} catch (LoaderError \$e) {
    // ignore missing template
}
EOF
        ];

        return $tests;
    }
}
