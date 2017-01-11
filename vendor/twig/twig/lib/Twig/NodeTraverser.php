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
 * Twig_NodeTraverser is a node traverser.
 *
 * It visits all nodes and their children and calls the given visitor for each.
 *
 * @final
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Twig_NodeTraverser
{
    protected $env;
    protected $visitors = array();

    /**
     * @param Twig_Environment            $env
     * @param Twig_NodeVisitorInterface[] $visitors
     */
    public function __construct(Twig_Environment $env, array $visitors = array())
    {
        $this->env = $env;
        foreach ($visitors as $visitor) {
            $this->addVisitor($visitor);
        }
    }

    public function addVisitor(Twig_NodeVisitorInterface $visitor)
    {
        if (!isset($this->visitors[$visitor->getPriority()])) {
            $this->visitors[$visitor->getPriority()] = array();
        }

        $this->visitors[$visitor->getPriority()][] = $visitor;
    }

    /**
     * Traverses a node and calls the registered visitors.
     *
     * @return Twig_NodeInterface
     */
    public function traverse(Twig_NodeInterface $node)
    {
        ksort($this->visitors);
        foreach ($this->visitors as $visitors) {
            foreach ($visitors as $visitor) {
                $node = $this->traverseForVisitor($visitor, $node);
            }
        }

        return $node;
    }

    protected function traverseForVisitor(Twig_NodeVisitorInterface $visitor, Twig_NodeInterface $node = null)
    {
        if (null === $node) {
            return;
        }

        $node = $visitor->enterNode($node, $this->env);

        foreach ($node as $k => $n) {
            if (false !== $n = $this->traverseForVisitor($visitor, $n)) {
                $node->setNode($k, $n);
            } else {
                $node->removeNode($k);
            }
        }

        return $visitor->leaveNode($node, $this->env);
    }
}
