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
class Twig_Node_Expression_GetAttr extends Twig_Node_Expression
{
    public function __construct(Twig_Node_Expression $node, Twig_Node_Expression $attribute, Twig_Node_Expression $arguments = null, $type, $lineno)
    {
        $nodes = ['node' => $node, 'attribute' => $attribute];
        if (null !== $arguments) {
            $nodes['arguments'] = $arguments;
        }

        parent::__construct($nodes, ['type' => $type, 'is_defined_test' => false, 'ignore_strict_check' => false, 'optimizable' => true], $lineno);
    }

    public function compile(Twig_Compiler $compiler)
    {
        $env = $compiler->getEnvironment();

        // optimize array calls
        if (
            $this->getAttribute('optimizable')
            && (!$env->isStrictVariables() || $this->getAttribute('ignore_strict_check'))
            && !$this->getAttribute('is_defined_test')
            && Twig_Template::ARRAY_CALL === $this->getAttribute('type')
        ) {
            $var = '$'.$compiler->getVarName();
            $compiler
                ->raw('(('.$var.' = ')
                ->subcompile($this->getNode('node'))
                ->raw(') && is_array(')
                ->raw($var)
                ->raw(') || ')
                ->raw($var)
                ->raw(' instanceof ArrayAccess ? (')
                ->raw($var)
                ->raw('[')
                ->subcompile($this->getNode('attribute'))
                ->raw('] ?? null) : null)')
            ;

            return;
        }

        $compiler->raw('twig_get_attribute($this->env, $this->source, ');

        if ($this->getAttribute('ignore_strict_check')) {
            $this->getNode('node')->setAttribute('ignore_strict_check', true);
        }

        $compiler->subcompile($this->getNode('node'));

        $compiler->raw(', ')->subcompile($this->getNode('attribute'));

        // only generate optional arguments when needed (to make generated code more readable)
        $needFifth = $env->hasExtension('Twig_Extension_Sandbox');
        $needFourth = $needFifth || $this->getAttribute('ignore_strict_check');
        $needThird = $needFourth || $this->getAttribute('is_defined_test');
        $needSecond = $needThird || Twig_Template::ANY_CALL !== $this->getAttribute('type');
        $needFirst = $needSecond || $this->hasNode('arguments');

        if ($needFirst) {
            if ($this->hasNode('arguments')) {
                $compiler->raw(', ')->subcompile($this->getNode('arguments'));
            } else {
                $compiler->raw(', []');
            }
        }

        if ($needSecond) {
            $compiler->raw(', ')->repr($this->getAttribute('type'));
        }

        if ($needThird) {
            $compiler->raw(', ')->repr($this->getAttribute('is_defined_test'));
        }

        if ($needFourth) {
            $compiler->raw(', ')->repr($this->getAttribute('ignore_strict_check'));
        }

        if ($needFifth) {
            $compiler->raw(', ')->repr($env->hasExtension('Twig_Extension_Sandbox'));
        }

        $compiler->raw(')');
    }
}

class_alias('Twig_Node_Expression_GetAttr', 'Twig\Node\Expression\GetAttrExpression', false);
