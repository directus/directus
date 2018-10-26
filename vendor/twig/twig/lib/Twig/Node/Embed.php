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
 * Represents an embed node.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Twig_Node_Embed extends Twig_Node_Include
{
    // we don't inject the module to avoid node visitors to traverse it twice (as it will be already visited in the main module)
    public function __construct($name, $index, Twig_Node_Expression $variables = null, $only = false, $ignoreMissing = false, $lineno, $tag = null)
    {
        parent::__construct(new Twig_Node_Expression_Constant('not_used', $lineno), $variables, $only, $ignoreMissing, $lineno, $tag);

        $this->setAttribute('name', $name);
        $this->setAttribute('index', $index);
    }

    protected function addGetTemplate(Twig_Compiler $compiler)
    {
        $compiler
            ->write('$this->loadTemplate(')
            ->string($this->getAttribute('name'))
            ->raw(', ')
            ->repr($this->getTemplateName())
            ->raw(', ')
            ->repr($this->getTemplateLine())
            ->raw(', ')
            ->string($this->getAttribute('index'))
            ->raw(')')
        ;
    }
}

class_alias('Twig_Node_Embed', 'Twig\Node\EmbedNode', false);
