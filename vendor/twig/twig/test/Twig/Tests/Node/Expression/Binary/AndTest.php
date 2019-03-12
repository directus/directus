<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use Twig\Node\Expression\Binary\AndBinary;
use Twig\Node\Expression\ConstantExpression;
use Twig\Test\NodeTestCase;

class Twig_Tests_Node_Expression_Binary_AndTest extends NodeTestCase
{
    public function testConstructor()
    {
        $left = new ConstantExpression(1, 1);
        $right = new ConstantExpression(2, 1);
        $node = new AndBinary($left, $right, 1);

        $this->assertEquals($left, $node->getNode('left'));
        $this->assertEquals($right, $node->getNode('right'));
    }

    public function getTests()
    {
        $left = new ConstantExpression(1, 1);
        $right = new ConstantExpression(2, 1);
        $node = new AndBinary($left, $right, 1);

        return [
            [$node, '(1 && 2)'],
        ];
    }
}
