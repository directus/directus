<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Twig\Node\Expression\Binary;

use Twig\Compiler;

class NotInBinary extends AbstractBinary
{
    public function compile(Compiler $compiler)
    {
        $compiler
            ->raw('!twig_in_filter(')
            ->subcompile($this->getNode('left'))
            ->raw(', ')
            ->subcompile($this->getNode('right'))
            ->raw(')')
        ;
    }

    public function operator(Compiler $compiler)
    {
        return $compiler->raw('not in');
    }
}

class_alias('Twig\Node\Expression\Binary\NotInBinary', 'Twig_Node_Expression_Binary_NotIn');
