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
use Twig\Node\Expression\Unary\NotUnary;
use Twig\Test\NodeTestCase;

class Twig_Tests_Node_Expression_Unary_NotTest extends NodeTestCase
{
    public function testConstructor()
    {
        $expr = new ConstantExpression(1, 1);
        $node = new NotUnary($expr, 1);

        $this->assertEquals($expr, $node->getNode('node'));
    }

    public function getTests()
    {
        $node = new ConstantExpression(1, 1);
        $node = new NotUnary($node, 1);

        return [
            [$node, '!1'],
        ];
    }
}
