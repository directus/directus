<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

final class Twig_NodeVisitor_SafeAnalysis extends Twig_BaseNodeVisitor
{
    private $data = array();
    private $safeVars = array();

    public function setSafeVars($safeVars)
    {
        $this->safeVars = $safeVars;
    }

    public function getSafe(Twig_Node $node)
    {
        $hash = spl_object_hash($node);
        if (!isset($this->data[$hash])) {
            return;
        }

        foreach ($this->data[$hash] as $bucket) {
            if ($bucket['key'] !== $node) {
                continue;
            }

            if (in_array('html_attr', $bucket['value'])) {
                $bucket['value'][] = 'html';
            }

            return $bucket['value'];
        }
    }

    private function setSafe(Twig_Node $node, array $safe)
    {
        $hash = spl_object_hash($node);
        if (isset($this->data[$hash])) {
            foreach ($this->data[$hash] as &$bucket) {
                if ($bucket['key'] === $node) {
                    $bucket['value'] = $safe;

                    return;
                }
            }
        }
        $this->data[$hash][] = array(
            'key' => $node,
            'value' => $safe,
        );
    }

    protected function doEnterNode(Twig_Node $node, Twig_Environment $env)
    {
        return $node;
    }

    protected function doLeaveNode(Twig_Node $node, Twig_Environment $env)
    {
        if ($node instanceof Twig_Node_Expression_Constant) {
            // constants are marked safe for all
            $this->setSafe($node, array('all'));
        } elseif ($node instanceof Twig_Node_Expression_BlockReference) {
            // blocks are safe by definition
            $this->setSafe($node, array('all'));
        } elseif ($node instanceof Twig_Node_Expression_Parent) {
            // parent block is safe by definition
            $this->setSafe($node, array('all'));
        } elseif ($node instanceof Twig_Node_Expression_Conditional) {
            // intersect safeness of both operands
            $safe = $this->intersectSafe($this->getSafe($node->getNode('expr2')), $this->getSafe($node->getNode('expr3')));
            $this->setSafe($node, $safe);
        } elseif ($node instanceof Twig_Node_Expression_Filter) {
            // filter expression is safe when the filter is safe
            $name = $node->getNode('filter')->getAttribute('value');
            $args = $node->getNode('arguments');
            if (false !== $filter = $env->getFilter($name)) {
                $safe = $filter->getSafe($args);
                if (null === $safe) {
                    $safe = $this->intersectSafe($this->getSafe($node->getNode('node')), $filter->getPreservesSafety());
                }
                $this->setSafe($node, $safe);
            } else {
                $this->setSafe($node, array());
            }
        } elseif ($node instanceof Twig_Node_Expression_Function) {
            // function expression is safe when the function is safe
            $name = $node->getAttribute('name');
            $args = $node->getNode('arguments');
            $function = $env->getFunction($name);
            if (false !== $function) {
                $this->setSafe($node, $function->getSafe($args));
            } else {
                $this->setSafe($node, array());
            }
        } elseif ($node instanceof Twig_Node_Expression_MethodCall) {
            if ($node->getAttribute('safe')) {
                $this->setSafe($node, array('all'));
            } else {
                $this->setSafe($node, array());
            }
        } elseif ($node instanceof Twig_Node_Expression_GetAttr && $node->getNode('node') instanceof Twig_Node_Expression_Name) {
            $name = $node->getNode('node')->getAttribute('name');
            if (in_array($name, $this->safeVars)) {
                $this->setSafe($node, array('all'));
            } else {
                $this->setSafe($node, array());
            }
        } else {
            $this->setSafe($node, array());
        }

        return $node;
    }

    private function intersectSafe(array $a = null, array $b = null)
    {
        if (null === $a || null === $b) {
            return array();
        }

        if (in_array('all', $a)) {
            return $b;
        }

        if (in_array('all', $b)) {
            return $a;
        }

        return array_intersect($a, $b);
    }

    public function getPriority()
    {
        return 0;
    }
}

class_alias('Twig_NodeVisitor_SafeAnalysis', 'Twig\NodeVisitor\SafeAnalysisNodeVisitor', false);
