<?php

/*
 * This file is part of Twig.
 *
 * (c) 2009 Fabien Potencier
 * (c) 2009 Armin Ronacher
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Represents a block call node.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Twig_Node_Expression_BlockReference extends Twig_Node_Expression
{
    public function __construct(Twig_NodeInterface $name, $asString = false, $lineno, $tag = null)
    {
        parent::__construct(array('name' => $name), array('as_string' => $asString, 'output' => false), $lineno, $tag);
    }

    public function compile(Twig_Compiler $compiler)
    {
        if ($this->getAttribute('as_string')) {
            $compiler->raw('(string) ');
        }

        if ($this->getAttribute('output')) {
            $compiler
                ->addDebugInfo($this)
                ->write('$this->displayBlock(')
                ->subcompile($this->getNode('name'))
                ->raw(", \$context, \$blocks);\n")
            ;
        } else {
            $compiler
                ->raw('$this->renderBlock(')
                ->subcompile($this->getNode('name'))
                ->raw(', $context, $blocks)')
            ;
        }
    }
}
