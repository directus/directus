<?php

/*
 * This file is part of Twig.
 *
 * (c) 2011 Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Checks if a variable is defined in the current context.
 *
 * <pre>
 * {# defined works with variable names and variable attributes #}
 * {% if foo is defined %}
 *     {# ... #}
 * {% endif %}
 * </pre>
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Twig_Node_Expression_Test_Defined extends Twig_Node_Expression_Test
{
    public function __construct(Twig_NodeInterface $node, $name, Twig_NodeInterface $arguments = null, $lineno)
    {
        if ($node instanceof Twig_Node_Expression_Name) {
            $node->setAttribute('is_defined_test', true);
        } elseif ($node instanceof Twig_Node_Expression_GetAttr) {
            $node->setAttribute('is_defined_test', true);

            $this->changeIgnoreStrictCheck($node);
        } elseif ($node instanceof Twig_Node_Expression_Constant || $node instanceof Twig_Node_Expression_Array) {
            $node = new Twig_Node_Expression_Constant(true, $node->getTemplateLine());
        } else {
            throw new Twig_Error_Syntax('The "defined" test only works with simple variables.', $this->getTemplateLine());
        }

        parent::__construct($node, $name, $arguments, $lineno);
    }

    protected function changeIgnoreStrictCheck(Twig_Node_Expression_GetAttr $node)
    {
        $node->setAttribute('ignore_strict_check', true);

        if ($node->getNode('node') instanceof Twig_Node_Expression_GetAttr) {
            $this->changeIgnoreStrictCheck($node->getNode('node'));
        }
    }

    public function compile(Twig_Compiler $compiler)
    {
        $compiler->subcompile($this->getNode('node'));
    }
}
