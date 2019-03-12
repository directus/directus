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
use Twig\Node\Expression\NullCoalesceExpression;
use Twig\Test\NodeTestCase;

class Twig_Tests_Node_Expression_NullCoalesceTest extends NodeTestCase
{
    public function getTests()
    {
        $left = new NameExpression('foo', 1);
        $right = new ConstantExpression(2, 1);
        $node = new NullCoalesceExpression($left, $right, 1);

        return [[$node, "((// line 1\n\$context[\"foo\"]) ?? (2))"]];
    }
}
