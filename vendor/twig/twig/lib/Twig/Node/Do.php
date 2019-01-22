<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Represents a do node.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Twig_Node_Do extends Twig_Node
{
    public function __construct(Twig_Node_Expression $expr, $lineno, $tag = null)
    {
        parent::__construct(['expr' => $expr], [], $lineno, $tag);
    }

    public function compile(Twig_Compiler $compiler)
    {
        $compiler
            ->addDebugInfo($this)
            ->write('')
            ->subcompile($this->getNode('expr'))
            ->raw(";\n")
        ;
    }
}

class_alias('Twig_Node_Do', 'Twig\Node\DoNode', false);
