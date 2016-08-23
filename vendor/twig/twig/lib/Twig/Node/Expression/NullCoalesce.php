<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
class Twig_Node_Expression_NullCoalesce extends Twig_Node_Expression_Conditional
{
    public function __construct(Twig_NodeInterface $left, Twig_NodeInterface $right, $lineno)
    {
        $test = new Twig_Node_Expression_Binary_And(
            new Twig_Node_Expression_Test_Defined(clone $left, 'defined', new Twig_Node(), $left->getLine()),
            new Twig_Node_Expression_Unary_Not(new Twig_Node_Expression_Test_Null($left, 'null', new Twig_Node(), $left->getLine()), $left->getLine()),
            $left->getLine()
        );

        parent::__construct($test, $left, $right, $lineno);
    }
}
