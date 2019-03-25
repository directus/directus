<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Twig\NodeVisitor;

use Twig\Environment;
use Twig\Extension\EscaperExtension;
use Twig\Node\AutoEscapeNode;
use Twig\Node\BlockNode;
use Twig\Node\BlockReferenceNode;
use Twig\Node\Expression\ConstantExpression;
use Twig\Node\Expression\FilterExpression;
use Twig\Node\ImportNode;
use Twig\Node\ModuleNode;
use Twig\Node\Node;
use Twig\Node\PrintNode;
use Twig\NodeTraverser;

/**
 * @author Fabien Potencier <fabien@symfony.com>
 */
final class EscaperNodeVisitor extends AbstractNodeVisitor
{
    private $statusStack = [];
    private $blocks = [];
    private $safeAnalysis;
    private $traverser;
    private $defaultStrategy = false;
    private $safeVars = [];

    public function __construct()
    {
        $this->safeAnalysis = new SafeAnalysisNodeVisitor();
    }

    protected function doEnterNode(Node $node, Environment $env)
    {
        if ($node instanceof ModuleNode) {
            if ($env->hasExtension(EscaperExtension::class) && $defaultStrategy = $env->getExtension(EscaperExtension::class)->getDefaultStrategy($node->getTemplateName())) {
                $this->defaultStrategy = $defaultStrategy;
            }
            $this->safeVars = [];
            $this->blocks = [];
        } elseif ($node instanceof AutoEscapeNode) {
            $this->statusStack[] = $node->getAttribute('value');
        } elseif ($node instanceof BlockNode) {
            $this->statusStack[] = isset($this->blocks[$node->getAttribute('name')]) ? $this->blocks[$node->getAttribute('name')] : $this->needEscaping($env);
        } elseif ($node instanceof ImportNode) {
            $this->safeVars[] = $node->getNode('var')->getAttribute('name');
        }

        return $node;
    }

    protected function doLeaveNode(Node $node, Environment $env)
    {
        if ($node instanceof ModuleNode) {
            $this->defaultStrategy = false;
            $this->safeVars = [];
            $this->blocks = [];
        } elseif ($node instanceof FilterExpression) {
            return $this->preEscapeFilterNode($node, $env);
        } elseif ($node instanceof PrintNode) {
            return $this->escapePrintNode($node, $env, $this->needEscaping($env));
        }

        if ($node instanceof AutoEscapeNode || $node instanceof BlockNode) {
            array_pop($this->statusStack);
        } elseif ($node instanceof BlockReferenceNode) {
            $this->blocks[$node->getAttribute('name')] = $this->needEscaping($env);
        }

        return $node;
    }

    private function escapePrintNode(PrintNode $node, Environment $env, $type)
    {
        if (false === $type) {
            return $node;
        }

        $expression = $node->getNode('expr');

        if ($this->isSafeFor($type, $expression, $env)) {
            return $node;
        }

        $class = \get_class($node);

        return new $class(
            $this->getEscaperFilter($type, $expression),
            $node->getTemplateLine()
        );
    }

    private function preEscapeFilterNode(FilterExpression $filter, Environment $env)
    {
        $name = $filter->getNode('filter')->getAttribute('value');

        $type = $env->getFilter($name)->getPreEscape();
        if (null === $type) {
            return $filter;
        }

        $node = $filter->getNode('node');
        if ($this->isSafeFor($type, $node, $env)) {
            return $filter;
        }

        $filter->setNode('node', $this->getEscaperFilter($type, $node));

        return $filter;
    }

    private function isSafeFor($type, Node $expression, $env)
    {
        $safe = $this->safeAnalysis->getSafe($expression);

        if (null === $safe) {
            if (null === $this->traverser) {
                $this->traverser = new NodeTraverser($env, [$this->safeAnalysis]);
            }

            $this->safeAnalysis->setSafeVars($this->safeVars);

            $this->traverser->traverse($expression);
            $safe = $this->safeAnalysis->getSafe($expression);
        }

        return \in_array($type, $safe) || \in_array('all', $safe);
    }

    private function needEscaping(Environment $env)
    {
        if (\count($this->statusStack)) {
            return $this->statusStack[\count($this->statusStack) - 1];
        }

        return $this->defaultStrategy ? $this->defaultStrategy : false;
    }

    private function getEscaperFilter(string $type, Node $node): FilterExpression
    {
        $line = $node->getTemplateLine();
        $name = new ConstantExpression('escape', $line);
        $args = new Node([new ConstantExpression((string) $type, $line), new ConstantExpression(null, $line), new ConstantExpression(true, $line)]);

        return new FilterExpression($node, $name, $args, $line);
    }

    public function getPriority()
    {
        return 0;
    }
}

class_alias('Twig\NodeVisitor\EscaperNodeVisitor', 'Twig_NodeVisitor_Escaper');
