<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Twig\Node;

use Twig\Compiler;

/**
 * Represents a spaceless node.
 *
 * It removes spaces between HTML tags.
 *
 * @deprecated since Twig 2.7, to be removed in 3.0
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class SpacelessNode extends Node implements NodeOutputInterface
{
    public function __construct(Node $body, int $lineno, string $tag = 'spaceless')
    {
        parent::__construct(['body' => $body], [], $lineno, $tag);
    }

    public function compile(Compiler $compiler)
    {
        $compiler
            ->addDebugInfo($this)
            ->write("ob_start(function () { return ''; });\n")
            ->subcompile($this->getNode('body'))
            ->write("echo trim(preg_replace('/>\s+</', '><', ob_get_clean()));\n")
        ;
    }
}

class_alias('Twig\Node\SpacelessNode', 'Twig_Node_Spaceless');
