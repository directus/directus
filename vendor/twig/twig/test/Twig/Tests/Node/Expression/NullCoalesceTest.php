<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_Node_Expression_NullCoalesceTest extends Twig_Test_NodeTestCase
{
    public function getTests()
    {
        $left = new Twig_Node_Expression_Name('foo', 1);
        $right = new Twig_Node_Expression_Constant(2, 1);
        $node = new Twig_Node_Expression_NullCoalesce($left, $right, 1);

        return [[$node, "((// line 1\n\$context[\"foo\"]) ?? (2))"]];
    }
}
