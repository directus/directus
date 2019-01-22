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
 * Represents a module node.
 *
 * Consider this class as being final. If you need to customize the behavior of
 * the generated class, consider adding nodes to the following nodes: display_start,
 * display_end, constructor_start, constructor_end, and class_end.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 *
 * @final since version 2.4.0
 */
class Twig_Node_Module extends Twig_Node
{
    private $source;

    public function __construct(Twig_Node $body, Twig_Node_Expression $parent = null, Twig_Node $blocks, Twig_Node $macros, Twig_Node $traits, $embeddedTemplates, Twig_Source $source)
    {
        if (__CLASS__ !== get_class($this)) {
            @trigger_error('Overriding '.__CLASS__.' is deprecated since version 2.4.0 and the class will be final in 3.0.', E_USER_DEPRECATED);
        }

        $this->source = $source;

        $nodes = [
            'body' => $body,
            'blocks' => $blocks,
            'macros' => $macros,
            'traits' => $traits,
            'display_start' => new Twig_Node(),
            'display_end' => new Twig_Node(),
            'constructor_start' => new Twig_Node(),
            'constructor_end' => new Twig_Node(),
            'class_end' => new Twig_Node(),
        ];
        if (null !== $parent) {
            $nodes['parent'] = $parent;
        }

        // embedded templates are set as attributes so that they are only visited once by the visitors
        parent::__construct($nodes, [
            'index' => null,
            'embedded_templates' => $embeddedTemplates,
        ], 1);

        // populate the template name of all node children
        $this->setTemplateName($this->source->getName());
    }

    public function setIndex($index)
    {
        $this->setAttribute('index', $index);
    }

    public function compile(Twig_Compiler $compiler)
    {
        $this->compileTemplate($compiler);

        foreach ($this->getAttribute('embedded_templates') as $template) {
            $compiler->subcompile($template);
        }
    }

    protected function compileTemplate(Twig_Compiler $compiler)
    {
        if (!$this->getAttribute('index')) {
            $compiler->write('<?php');
        }

        $this->compileClassHeader($compiler);

        $this->compileConstructor($compiler);

        $this->compileGetParent($compiler);

        $this->compileDisplay($compiler);

        $compiler->subcompile($this->getNode('blocks'));

        $this->compileMacros($compiler);

        $this->compileGetTemplateName($compiler);

        $this->compileIsTraitable($compiler);

        $this->compileDebugInfo($compiler);

        $this->compileGetSourceContext($compiler);

        $this->compileClassFooter($compiler);
    }

    protected function compileGetParent(Twig_Compiler $compiler)
    {
        if (!$this->hasNode('parent')) {
            return;
        }
        $parent = $this->getNode('parent');

        $compiler
            ->write("protected function doGetParent(array \$context)\n", "{\n")
            ->indent()
            ->addDebugInfo($parent)
            ->write('return ')
        ;

        if ($parent instanceof Twig_Node_Expression_Constant) {
            $compiler->subcompile($parent);
        } else {
            $compiler
                ->raw('$this->loadTemplate(')
                ->subcompile($parent)
                ->raw(', ')
                ->repr($this->source->getName())
                ->raw(', ')
                ->repr($parent->getTemplateLine())
                ->raw(')')
            ;
        }

        $compiler
            ->raw(";\n")
            ->outdent()
            ->write("}\n\n")
        ;
    }

    protected function compileClassHeader(Twig_Compiler $compiler)
    {
        $compiler
            ->write("\n\n")
            // if the template name contains */, add a blank to avoid a PHP parse error
            ->write('/* '.str_replace('*/', '* /', $this->source->getName())." */\n")
            ->write('class '.$compiler->getEnvironment()->getTemplateClass($this->source->getName(), $this->getAttribute('index')))
            ->raw(sprintf(" extends %s\n", $compiler->getEnvironment()->getBaseTemplateClass()))
            ->write("{\n")
            ->indent()
            ->write("private \$source;\n\n")
        ;
    }

    protected function compileConstructor(Twig_Compiler $compiler)
    {
        $compiler
            ->write("public function __construct(Twig_Environment \$env)\n", "{\n")
            ->indent()
            ->subcompile($this->getNode('constructor_start'))
            ->write("parent::__construct(\$env);\n\n")
            ->write("\$this->source = \$this->getSourceContext();\n\n")
        ;

        // parent
        if (!$this->hasNode('parent')) {
            $compiler->write("\$this->parent = false;\n\n");
        } elseif (($parent = $this->getNode('parent')) && $parent instanceof Twig_Node_Expression_Constant) {
            $compiler
                ->addDebugInfo($parent)
                ->write('$this->parent = $this->loadTemplate(')
                ->subcompile($parent)
                ->raw(', ')
                ->repr($this->source->getName())
                ->raw(', ')
                ->repr($parent->getTemplateLine())
                ->raw(");\n")
            ;
        }

        $countTraits = count($this->getNode('traits'));
        if ($countTraits) {
            // traits
            foreach ($this->getNode('traits') as $i => $trait) {
                $node = $trait->getNode('template');

                $compiler
                    ->write(sprintf('$_trait_%s = $this->loadTemplate(', $i))
                    ->subcompile($node)
                    ->raw(', ')
                    ->repr($node->getTemplateName())
                    ->raw(', ')
                    ->repr($node->getTemplateLine())
                    ->raw(");\n")
                ;

                $compiler
                    ->addDebugInfo($trait->getNode('template'))
                    ->write(sprintf("if (!\$_trait_%s->isTraitable()) {\n", $i))
                    ->indent()
                    ->write("throw new Twig_Error_Runtime('Template \"'.")
                    ->subcompile($trait->getNode('template'))
                    ->raw(".'\" cannot be used as a trait.', ")
                    ->repr($node->getTemplateLine())
                    ->raw(", \$this->source);\n")
                    ->outdent()
                    ->write("}\n")
                    ->write(sprintf("\$_trait_%s_blocks = \$_trait_%s->getBlocks();\n\n", $i, $i))
                ;

                foreach ($trait->getNode('targets') as $key => $value) {
                    $compiler
                        ->write(sprintf('if (!isset($_trait_%s_blocks[', $i))
                        ->string($key)
                        ->raw("])) {\n")
                        ->indent()
                        ->write("throw new Twig_Error_Runtime('Block ")
                        ->string($key)
                        ->raw(' is not defined in trait ')
                        ->subcompile($trait->getNode('template'))
                        ->raw(".', ")
                        ->repr($node->getTemplateLine())
                        ->raw(", \$this->source);\n")
                        ->outdent()
                        ->write("}\n\n")

                        ->write(sprintf('$_trait_%s_blocks[', $i))
                        ->subcompile($value)
                        ->raw(sprintf('] = $_trait_%s_blocks[', $i))
                        ->string($key)
                        ->raw(sprintf(']; unset($_trait_%s_blocks[', $i))
                        ->string($key)
                        ->raw("]);\n\n")
                    ;
                }
            }

            if ($countTraits > 1) {
                $compiler
                    ->write("\$this->traits = array_merge(\n")
                    ->indent()
                ;

                for ($i = 0; $i < $countTraits; ++$i) {
                    $compiler
                        ->write(sprintf('$_trait_%s_blocks'.($i == $countTraits - 1 ? '' : ',')."\n", $i))
                    ;
                }

                $compiler
                    ->outdent()
                    ->write(");\n\n")
                ;
            } else {
                $compiler
                    ->write("\$this->traits = \$_trait_0_blocks;\n\n")
                ;
            }

            $compiler
                ->write("\$this->blocks = array_merge(\n")
                ->indent()
                ->write("\$this->traits,\n")
                ->write("[\n")
            ;
        } else {
            $compiler
                ->write("\$this->blocks = [\n")
            ;
        }

        // blocks
        $compiler
            ->indent()
        ;

        foreach ($this->getNode('blocks') as $name => $node) {
            $compiler
                ->write(sprintf("'%s' => [\$this, 'block_%s'],\n", $name, $name))
            ;
        }

        if ($countTraits) {
            $compiler
                ->outdent()
                ->write("]\n")
                ->outdent()
                ->write(");\n")
            ;
        } else {
            $compiler
                ->outdent()
                ->write("];\n")
            ;
        }

        $compiler
            ->outdent()
            ->subcompile($this->getNode('constructor_end'))
            ->write("}\n\n")
        ;
    }

    protected function compileDisplay(Twig_Compiler $compiler)
    {
        $compiler
            ->write("protected function doDisplay(array \$context, array \$blocks = [])\n", "{\n")
            ->indent()
            ->subcompile($this->getNode('display_start'))
            ->subcompile($this->getNode('body'))
        ;

        if ($this->hasNode('parent')) {
            $parent = $this->getNode('parent');
            $compiler->addDebugInfo($parent);
            if ($parent instanceof Twig_Node_Expression_Constant) {
                $compiler->write('$this->parent');
            } else {
                $compiler->write('$this->getParent($context)');
            }
            $compiler->raw("->display(\$context, array_merge(\$this->blocks, \$blocks));\n");
        }

        $compiler
            ->subcompile($this->getNode('display_end'))
            ->outdent()
            ->write("}\n\n")
        ;
    }

    protected function compileClassFooter(Twig_Compiler $compiler)
    {
        $compiler
            ->subcompile($this->getNode('class_end'))
            ->outdent()
            ->write("}\n")
        ;
    }

    protected function compileMacros(Twig_Compiler $compiler)
    {
        $compiler->subcompile($this->getNode('macros'));
    }

    protected function compileGetTemplateName(Twig_Compiler $compiler)
    {
        $compiler
            ->write("public function getTemplateName()\n", "{\n")
            ->indent()
            ->write('return ')
            ->repr($this->source->getName())
            ->raw(";\n")
            ->outdent()
            ->write("}\n\n")
        ;
    }

    protected function compileIsTraitable(Twig_Compiler $compiler)
    {
        // A template can be used as a trait if:
        //   * it has no parent
        //   * it has no macros
        //   * it has no body
        //
        // Put another way, a template can be used as a trait if it
        // only contains blocks and use statements.
        $traitable = !$this->hasNode('parent') && 0 === count($this->getNode('macros'));
        if ($traitable) {
            if ($this->getNode('body') instanceof Twig_Node_Body) {
                $nodes = $this->getNode('body')->getNode(0);
            } else {
                $nodes = $this->getNode('body');
            }

            if (!count($nodes)) {
                $nodes = new Twig_Node([$nodes]);
            }

            foreach ($nodes as $node) {
                if (!count($node)) {
                    continue;
                }

                if ($node instanceof Twig_Node_Text && ctype_space($node->getAttribute('data'))) {
                    continue;
                }

                if ($node instanceof Twig_Node_BlockReference) {
                    continue;
                }

                $traitable = false;
                break;
            }
        }

        if ($traitable) {
            return;
        }

        $compiler
            ->write("public function isTraitable()\n", "{\n")
            ->indent()
            ->write(sprintf("return %s;\n", $traitable ? 'true' : 'false'))
            ->outdent()
            ->write("}\n\n")
        ;
    }

    protected function compileDebugInfo(Twig_Compiler $compiler)
    {
        $compiler
            ->write("public function getDebugInfo()\n", "{\n")
            ->indent()
            ->write(sprintf("return %s;\n", str_replace("\n", '', var_export(array_reverse($compiler->getDebugInfo(), true), true))))
            ->outdent()
            ->write("}\n\n")
        ;
    }

    protected function compileGetSourceContext(Twig_Compiler $compiler)
    {
        $compiler
            ->write("public function getSourceContext()\n", "{\n")
            ->indent()
            ->write('return new Twig_Source(')
            ->string($compiler->getEnvironment()->isDebug() ? $this->source->getCode() : '')
            ->raw(', ')
            ->string($this->source->getName())
            ->raw(', ')
            ->string($this->source->getPath())
            ->raw(");\n")
            ->outdent()
            ->write("}\n")
        ;
    }

    protected function compileLoadTemplate(Twig_Compiler $compiler, $node, $var)
    {
        if ($node instanceof Twig_Node_Expression_Constant) {
            $compiler
                ->write(sprintf('%s = $this->loadTemplate(', $var))
                ->subcompile($node)
                ->raw(', ')
                ->repr($node->getTemplateName())
                ->raw(', ')
                ->repr($node->getTemplateLine())
                ->raw(");\n")
            ;
        } else {
            throw new LogicException('Trait templates can only be constant nodes.');
        }
    }
}

class_alias('Twig_Node_Module', 'Twig\Node\ModuleNode', false);
