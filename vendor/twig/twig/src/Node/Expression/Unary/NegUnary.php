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

namespace Twig\Node\Expression\Unary;

use Twig\Compiler;

class NegUnary extends AbstractUnary
{
    public function operator(Compiler $compiler): Compiler
    {
        return $compiler->raw('-');
    }
}
