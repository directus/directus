<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 * (c) Armin Ronacher
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
class Twig_Node_Expression_Constant extends Twig_Node_Expression
{
    public function __construct($value, $lineno)
    {
        parent::__construct(array(), array('value' => $value), $lineno);
    }

    public function compile(Twig_Compiler $compiler)
    {
        $compiler->repr($this->getAttribute('value'));
    }
}
