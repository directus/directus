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
use Twig\Node\Expression\ConstantExpression;

/**
 * Represents a set node.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class SetNode extends Node implements NodeCaptureInterface
{
    public function __construct(bool $capture, Node $names, Node $values, int $lineno, string $tag = null)
    {
        parent::__construct(['names' => $names, 'values' => $values], ['capture' => $capture, 'safe' => false], $lineno, $tag);

        /*
         * Optimizes the node when capture is used for a large block of text.
         *
         * {% set foo %}foo{% endset %} is compiled to $context['foo'] = new Twig\Markup("foo");
         */
        if ($this->getAttribute('capture')) {
            $this->setAttribute('safe', true);

            $values = $this->getNode('values');
            if ($values instanceof TextNode) {
                $this->setNode('values', new ConstantExpression($values->getAttribute('data'), $values->getTemplateLine()));
                $this->setAttribute('capture', false);
            }
        }
    }

    public function compile(Compiler $compiler)
    {
        $compiler->addDebugInfo($this);

        if (\count($this->getNode('names')) > 1) {
            $compiler->write('list(');
            foreach ($this->getNode('names') as $idx => $node) {
                if ($idx) {
                    $compiler->raw(', ');
                }

                $compiler->subcompile($node);
            }
            $compiler->raw(')');
        } else {
            if ($this->getAttribute('capture')) {
                if ($compiler->getEnvironment()->isDebug()) {
                    $compiler->write("ob_start();\n");
                } else {
                    $compiler->write("ob_start(function () { return ''; });\n");
                }
                $compiler
                    ->subcompile($this->getNode('values'))
                ;
            }

            $compiler->subcompile($this->getNode('names'), false);

            if ($this->getAttribute('capture')) {
                $compiler->raw(" = ('' === \$tmp = ob_get_clean()) ? '' : new Markup(\$tmp, \$this->env->getCharset())");
            }
        }

        if (!$this->getAttribute('capture')) {
            $compiler->raw(' = ');

            if (\count($this->getNode('names')) > 1) {
                $compiler->write('[');
                foreach ($this->getNode('values') as $idx => $value) {
                    if ($idx) {
                        $compiler->raw(', ');
                    }

                    $compiler->subcompile($value);
                }
                $compiler->raw(']');
            } else {
                if ($this->getAttribute('safe')) {
                    $compiler
                        ->raw("('' === \$tmp = ")
                        ->subcompile($this->getNode('values'))
                        ->raw(") ? '' : new Markup(\$tmp, \$this->env->getCharset())")
                    ;
                } else {
                    $compiler->subcompile($this->getNode('values'));
                }
            }
        }

        $compiler->raw(";\n");
    }
}

class_alias('Twig\Node\SetNode', 'Twig_Node_Set');
