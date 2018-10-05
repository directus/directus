<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Config\Definition\Builder;

use Symfony\Component\Config\Definition\VariableNode;

/**
 * This class provides a fluent interface for defining a node.
 *
 * @author Johannes M. Schmitt <schmittjoh@gmail.com>
 */
class VariableNodeDefinition extends NodeDefinition
{
    /**
     * Instantiate a Node.
     *
     * @return VariableNode The node
     */
    protected function instantiateNode()
    {
        return new VariableNode($this->name, $this->parent, $this->pathSeparator);
    }

    /**
     * {@inheritdoc}
     */
    protected function createNode()
    {
        $node = $this->instantiateNode();

        if (null !== $this->normalization) {
            $node->setNormalizationClosures($this->normalization->before);
        }

        if (null !== $this->merge) {
            $node->setAllowOverwrite($this->merge->allowOverwrite);
        }

        if (true === $this->default) {
            $node->setDefaultValue($this->defaultValue);
        }

        $node->setAllowEmptyValue($this->allowEmptyValue);
        $node->addEquivalentValue(null, $this->nullEquivalent);
        $node->addEquivalentValue(true, $this->trueEquivalent);
        $node->addEquivalentValue(false, $this->falseEquivalent);
        $node->setRequired($this->required);
        $node->setDeprecated($this->deprecationMessage);

        if (null !== $this->validation) {
            $node->setFinalValidationClosures($this->validation->rules);
        }

        return $node;
    }
}
