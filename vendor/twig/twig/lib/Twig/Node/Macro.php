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
 * Represents a macro node.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Twig_Node_Macro extends Twig_Node
{
    const VARARGS_NAME = 'varargs';

    public function __construct($name, Twig_Node $body, Twig_Node $arguments, $lineno, $tag = null)
    {
        foreach ($arguments as $argumentName => $argument) {
            if (self::VARARGS_NAME === $argumentName) {
                throw new Twig_Error_Syntax(sprintf('The argument "%s" in macro "%s" cannot be defined because the variable "%s" is reserved for arbitrary arguments.', self::VARARGS_NAME, $name, self::VARARGS_NAME), $argument->getTemplateLine());
            }
        }

        parent::__construct(['body' => $body, 'arguments' => $arguments], ['name' => $name], $lineno, $tag);
    }

    public function compile(Twig_Compiler $compiler)
    {
        $compiler
            ->addDebugInfo($this)
            ->write(sprintf('public function macro_%s(', $this->getAttribute('name')))
        ;

        $count = count($this->getNode('arguments'));
        $pos = 0;
        foreach ($this->getNode('arguments') as $name => $default) {
            $compiler
                ->raw('$__'.$name.'__ = ')
                ->subcompile($default)
            ;

            if (++$pos < $count) {
                $compiler->raw(', ');
            }
        }

        if ($count) {
            $compiler->raw(', ');
        }

        $compiler
            ->raw('...$__varargs__')
            ->raw(")\n")
            ->write("{\n")
            ->indent()
        ;

        $compiler
            ->write("\$context = \$this->env->mergeGlobals([\n")
            ->indent()
        ;

        foreach ($this->getNode('arguments') as $name => $default) {
            $compiler
                ->write('')
                ->string($name)
                ->raw(' => $__'.$name.'__')
                ->raw(",\n")
            ;
        }

        $compiler
            ->write('')
            ->string(self::VARARGS_NAME)
            ->raw(' => ')
        ;

        $compiler
            ->raw("\$__varargs__,\n")
            ->outdent()
            ->write("]);\n\n")
            ->write("\$blocks = [];\n\n")
            ->write("ob_start();\n")
            ->write("try {\n")
            ->indent()
            ->subcompile($this->getNode('body'))
            ->raw("\n")
            ->write("return ('' === \$tmp = ob_get_contents()) ? '' : new Twig_Markup(\$tmp, \$this->env->getCharset());\n")
            ->outdent()
            ->write("} finally {\n")
            ->indent()
            ->write("ob_end_clean();\n")
            ->outdent()
            ->write("}\n")
            ->outdent()
            ->write("}\n\n")
        ;
    }
}

class_alias('Twig_Node_Macro', 'Twig\Node\MacroNode', false);
