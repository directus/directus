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
 * Represents an if node.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Twig_Node_If extends Twig_Node
{
    public function __construct(Twig_NodeInterface $tests, Twig_NodeInterface $else = null, $lineno, $tag = null)
    {
        $nodes = array('tests' => $tests);
        if (null !== $else) {
            $nodes['else'] = $else;
        }

        parent::__construct($nodes, array(), $lineno, $tag);
    }

    public function compile(Twig_Compiler $compiler)
    {
        $compiler->addDebugInfo($this);
        for ($i = 0, $count = count($this->getNode('tests')); $i < $count; $i += 2) {
            if ($i > 0) {
                $compiler
                    ->outdent()
                    ->write('} elseif (')
                ;
            } else {
                $compiler
                    ->write('if (')
                ;
            }

            $compiler
                ->subcompile($this->getNode('tests')->getNode($i))
                ->raw(") {\n")
                ->indent()
                ->subcompile($this->getNode('tests')->getNode($i + 1))
            ;
        }

        if ($this->hasNode('else')) {
            $compiler
                ->outdent()
                ->write("} else {\n")
                ->indent()
                ->subcompile($this->getNode('else'))
            ;
        }

        $compiler
            ->outdent()
            ->write("}\n");
    }
}
