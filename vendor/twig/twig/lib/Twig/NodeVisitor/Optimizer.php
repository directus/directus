<?php

/*
 * This file is part of Twig.
 *
 * (c) 2010 Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Twig_NodeVisitor_Optimizer tries to optimizes the AST.
 *
 * This visitor is always the last registered one.
 *
 * You can configure which optimizations you want to activate via the
 * optimizer mode.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Twig_NodeVisitor_Optimizer extends Twig_BaseNodeVisitor
{
    const OPTIMIZE_ALL = -1;
    const OPTIMIZE_NONE = 0;
    const OPTIMIZE_FOR = 2;
    const OPTIMIZE_RAW_FILTER = 4;
    const OPTIMIZE_VAR_ACCESS = 8;

    protected $loops = array();
    protected $loopsTargets = array();
    protected $optimizers;
    protected $prependedNodes = array();
    protected $inABody = false;

    /**
     * Constructor.
     *
     * @param int $optimizers The optimizer mode
     */
    public function __construct($optimizers = -1)
    {
        if (!is_int($optimizers) || $optimizers > (self::OPTIMIZE_FOR | self::OPTIMIZE_RAW_FILTER | self::OPTIMIZE_VAR_ACCESS)) {
            throw new InvalidArgumentException(sprintf('Optimizer mode "%s" is not valid.', $optimizers));
        }

        $this->optimizers = $optimizers;
    }

    /**
     * {@inheritdoc}
     */
    protected function doEnterNode(Twig_Node $node, Twig_Environment $env)
    {
        if (self::OPTIMIZE_FOR === (self::OPTIMIZE_FOR & $this->optimizers)) {
            $this->enterOptimizeFor($node, $env);
        }

        if (PHP_VERSION_ID < 50400 && self::OPTIMIZE_VAR_ACCESS === (self::OPTIMIZE_VAR_ACCESS & $this->optimizers) && !$env->isStrictVariables() && !$env->hasExtension('sandbox')) {
            if ($this->inABody) {
                if (!$node instanceof Twig_Node_Expression) {
                    if (get_class($node) !== 'Twig_Node') {
                        array_unshift($this->prependedNodes, array());
                    }
                } else {
                    $node = $this->optimizeVariables($node, $env);
                }
            } elseif ($node instanceof Twig_Node_Body) {
                $this->inABody = true;
            }
        }

        return $node;
    }

    /**
     * {@inheritdoc}
     */
    protected function doLeaveNode(Twig_Node $node, Twig_Environment $env)
    {
        $expression = $node instanceof Twig_Node_Expression;

        if (self::OPTIMIZE_FOR === (self::OPTIMIZE_FOR & $this->optimizers)) {
            $this->leaveOptimizeFor($node, $env);
        }

        if (self::OPTIMIZE_RAW_FILTER === (self::OPTIMIZE_RAW_FILTER & $this->optimizers)) {
            $node = $this->optimizeRawFilter($node, $env);
        }

        $node = $this->optimizePrintNode($node, $env);

        if (self::OPTIMIZE_VAR_ACCESS === (self::OPTIMIZE_VAR_ACCESS & $this->optimizers) && !$env->isStrictVariables() && !$env->hasExtension('sandbox')) {
            if ($node instanceof Twig_Node_Body) {
                $this->inABody = false;
            } elseif ($this->inABody) {
                if (!$expression && get_class($node) !== 'Twig_Node' && $prependedNodes = array_shift($this->prependedNodes)) {
                    $nodes = array();
                    foreach (array_unique($prependedNodes) as $name) {
                        $nodes[] = new Twig_Node_SetTemp($name, $node->getLine());
                    }

                    $nodes[] = $node;
                    $node = new Twig_Node($nodes);
                }
            }
        }

        return $node;
    }

    protected function optimizeVariables(Twig_NodeInterface $node, Twig_Environment $env)
    {
        if ('Twig_Node_Expression_Name' === get_class($node) && $node->isSimple()) {
            $this->prependedNodes[0][] = $node->getAttribute('name');

            return new Twig_Node_Expression_TempName($node->getAttribute('name'), $node->getLine());
        }

        return $node;
    }

    /**
     * Optimizes print nodes.
     *
     * It replaces:
     *
     *   * "echo $this->render(Parent)Block()" with "$this->display(Parent)Block()"
     *
     * @param Twig_NodeInterface $node A Node
     * @param Twig_Environment   $env  The current Twig environment
     *
     * @return Twig_NodeInterface
     */
    protected function optimizePrintNode(Twig_NodeInterface $node, Twig_Environment $env)
    {
        if (!$node instanceof Twig_Node_Print) {
            return $node;
        }

        if (
            $node->getNode('expr') instanceof Twig_Node_Expression_BlockReference ||
            $node->getNode('expr') instanceof Twig_Node_Expression_Parent
        ) {
            $node->getNode('expr')->setAttribute('output', true);

            return $node->getNode('expr');
        }

        return $node;
    }

    /**
     * Removes "raw" filters.
     *
     * @param Twig_NodeInterface $node A Node
     * @param Twig_Environment   $env  The current Twig environment
     *
     * @return Twig_NodeInterface
     */
    protected function optimizeRawFilter(Twig_NodeInterface $node, Twig_Environment $env)
    {
        if ($node instanceof Twig_Node_Expression_Filter && 'raw' == $node->getNode('filter')->getAttribute('value')) {
            return $node->getNode('node');
        }

        return $node;
    }

    /**
     * Optimizes "for" tag by removing the "loop" variable creation whenever possible.
     *
     * @param Twig_NodeInterface $node A Node
     * @param Twig_Environment   $env  The current Twig environment
     */
    protected function enterOptimizeFor(Twig_NodeInterface $node, Twig_Environment $env)
    {
        if ($node instanceof Twig_Node_For) {
            // disable the loop variable by default
            $node->setAttribute('with_loop', false);
            array_unshift($this->loops, $node);
            array_unshift($this->loopsTargets, $node->getNode('value_target')->getAttribute('name'));
            array_unshift($this->loopsTargets, $node->getNode('key_target')->getAttribute('name'));
        } elseif (!$this->loops) {
            // we are outside a loop
            return;
        }

        // when do we need to add the loop variable back?

        // the loop variable is referenced for the current loop
        elseif ($node instanceof Twig_Node_Expression_Name && 'loop' === $node->getAttribute('name')) {
            $node->setAttribute('always_defined', true);
            $this->addLoopToCurrent();
        }

        // optimize access to loop targets
        elseif ($node instanceof Twig_Node_Expression_Name && in_array($node->getAttribute('name'), $this->loopsTargets)) {
            $node->setAttribute('always_defined', true);
        }

        // block reference
        elseif ($node instanceof Twig_Node_BlockReference || $node instanceof Twig_Node_Expression_BlockReference) {
            $this->addLoopToCurrent();
        }

        // include without the only attribute
        elseif ($node instanceof Twig_Node_Include && !$node->getAttribute('only')) {
            $this->addLoopToAll();
        }

        // include function without the with_context=false parameter
        elseif ($node instanceof Twig_Node_Expression_Function
            && 'include' === $node->getAttribute('name')
            && (!$node->getNode('arguments')->hasNode('with_context')
                 || false !== $node->getNode('arguments')->getNode('with_context')->getAttribute('value')
               )
        ) {
            $this->addLoopToAll();
        }

        // the loop variable is referenced via an attribute
        elseif ($node instanceof Twig_Node_Expression_GetAttr
            && (!$node->getNode('attribute') instanceof Twig_Node_Expression_Constant
                || 'parent' === $node->getNode('attribute')->getAttribute('value')
               )
            && (true === $this->loops[0]->getAttribute('with_loop')
                || ($node->getNode('node') instanceof Twig_Node_Expression_Name
                    && 'loop' === $node->getNode('node')->getAttribute('name')
                   )
               )
        ) {
            $this->addLoopToAll();
        }
    }

    /**
     * Optimizes "for" tag by removing the "loop" variable creation whenever possible.
     *
     * @param Twig_NodeInterface $node A Node
     * @param Twig_Environment   $env  The current Twig environment
     */
    protected function leaveOptimizeFor(Twig_NodeInterface $node, Twig_Environment $env)
    {
        if ($node instanceof Twig_Node_For) {
            array_shift($this->loops);
            array_shift($this->loopsTargets);
            array_shift($this->loopsTargets);
        }
    }

    protected function addLoopToCurrent()
    {
        $this->loops[0]->setAttribute('with_loop', true);
    }

    protected function addLoopToAll()
    {
        foreach ($this->loops as $loop) {
            $loop->setAttribute('with_loop', true);
        }
    }

    /**
     * {@inheritdoc}
     */
    public function getPriority()
    {
        return 255;
    }
}
