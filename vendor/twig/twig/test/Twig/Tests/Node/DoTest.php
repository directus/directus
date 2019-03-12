<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use Twig\Node\DoNode;
use Twig\Node\Expression\ConstantExpression;
use Twig\Test\NodeTestCase;

class Twig_Tests_Node_DoTest extends NodeTestCase
{
    public function testConstructor()
    {
        $expr = new ConstantExpression('foo', 1);
        $node = new DoNode($expr, 1);

        $this->assertEquals($expr, $node->getNode('expr'));
    }

    public function getTests()
    {
        $tests = [];

        $expr = new ConstantExpression('foo', 1);
        $node = new DoNode($expr, 1);
        $tests[] = [$node, "// line 1\n\"foo\";"];

        return $tests;
    }
}
