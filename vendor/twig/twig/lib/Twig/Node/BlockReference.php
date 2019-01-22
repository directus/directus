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

/**
 * Represents a block call node.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Twig_Node_BlockReference extends Twig_Node implements Twig_NodeOutputInterface
{
    public function __construct($name, $lineno, $tag = null)
    {
        parent::__construct([], ['name' => $name], $lineno, $tag);
    }

    public function compile(Twig_Compiler $compiler)
    {
        $compiler
            ->addDebugInfo($this)
            ->write(sprintf("\$this->displayBlock('%s', \$context, \$blocks);\n", $this->getAttribute('name')))
        ;
    }
}

class_alias('Twig_Node_BlockReference', 'Twig\Node\BlockReferenceNode', false);
