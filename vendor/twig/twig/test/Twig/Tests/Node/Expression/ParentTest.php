<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use Twig\Node\Expression\ParentExpression;
use Twig\Test\NodeTestCase;

class Twig_Tests_Node_Expression_ParentTest extends NodeTestCase
{
    public function testConstructor()
    {
        $node = new ParentExpression('foo', 1);

        $this->assertEquals('foo', $node->getAttribute('name'));
    }

    public function getTests()
    {
        $tests = [];
        $tests[] = [new ParentExpression('foo', 1), '$this->renderParentBlock("foo", $context, $blocks)'];

        return $tests;
    }
}
