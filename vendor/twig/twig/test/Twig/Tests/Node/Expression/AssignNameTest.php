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
use Twig\Test\NodeTestCase;

class Twig_Tests_Node_Expression_AssignNameTest extends NodeTestCase
{
    public function testConstructor()
    {
        $node = new AssignNameExpression('foo', 1);

        $this->assertEquals('foo', $node->getAttribute('name'));
    }

    public function getTests()
    {
        $node = new AssignNameExpression('foo', 1);

        return [
            [$node, '$context["foo"]'],
        ];
    }
}
