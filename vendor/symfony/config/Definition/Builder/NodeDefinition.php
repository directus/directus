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

use Symfony\Component\Config\Definition\BaseNode;
use Symfony\Component\Config\Definition\Exception\InvalidDefinitionException;
use Symfony\Component\Config\Definition\NodeInterface;

/**
 * This class provides a fluent interface for defining a node.
 *
 * @author Johannes M. Schmitt <schmittjoh@gmail.com>
 */
abstract class NodeDefinition implements NodeParentInterface
{
    protected $name;
    protected $normalization;
    protected $validation;
    protected $defaultValue;
    protected $default = false;
    protected $required = false;
    protected $deprecationMessage = null;
    protected $merge;
    protected $allowEmptyValue = true;
    protected $nullEquivalent;
    protected $trueEquivalent = true;
    protected $falseEquivalent = false;
    protected $pathSeparator = BaseNode::DEFAULT_PATH_SEPARATOR;
    protected $parent;
    protected $attributes = [];

    public function __construct(?string $name, NodeParentInterface $parent = null)
    {
        $this->parent = $parent;
        $this->name = $name;
    }

    /**
     * Sets the parent node.
     *
     * @return $this
     */
    public function setParent(NodeParentInterface $parent)
    {
        $this->parent = $parent;

        return $this;
    }

    /**
     * Sets info message.
     *
     * @param string $info The info text
     *
     * @return $this
     */
    public function info($info)
    {
        return $this->attribute('info', $info);
    }

    /**
     * Sets example configuration.
     *
     * @param string|array $example
     *
     * @return $this
     */
    public function example($example)
    {
        return $this->attribute('example', $example);
    }

    /**
     * Sets an attribute on the node.
     *
     * @param string $key
     * @param mixed  $value
     *
     * @return $this
     */
    public function attribute($key, $value)
    {
        $this->attributes[$key] = $value;

        return $this;
    }

    /**
     * Returns the parent node.
     *
     * @return NodeParentInterface|NodeBuilder|NodeDefinition|ArrayNodeDefinition|VariableNodeDefinition|null The builder of the parent node
     */
    public function end()
    {
        return $this->parent;
    }

    /**
     * Creates the node.
     *
     * @param bool $forceRootNode Whether to force this node as the root node
     *
     * @return NodeInterface
     */
    public function getNode($forceRootNode = false)
    {
        if ($forceRootNode) {
            $this->parent = null;
        }

        if (null !== $this->normalization) {
            $this->normalization->before = ExprBuilder::buildExpressions($this->normalization->before);
        }

        if (null !== $this->validation) {
            $this->validation->rules = ExprBuilder::buildExpressions($this->validation->rules);
        }

        $node = $this->createNode();
        $node->setAttributes($this->attributes);

        return $node;
    }

    /**
     * Sets the default value.
     *
     * @param mixed $value The default value
     *
     * @return $this
     */
    public function defaultValue($value)
    {
        $this->default = true;
        $this->defaultValue = $value;

        return $this;
    }

    /**
     * Sets the node as required.
     *
     * @return $this
     */
    public function isRequired()
    {
        $this->required = true;

        return $this;
    }

    /**
     * Sets the node as deprecated.
     *
     * You can use %node% and %path% placeholders in your message to display,
     * respectively, the node name and its complete path.
     *
     * @param string $message Deprecation message
     *
     * @return $this
     */
    public function setDeprecated($message = 'The child node "%node%" at path "%path%" is deprecated.')
    {
        $this->deprecationMessage = $message;

        return $this;
    }

    /**
     * Sets the equivalent value used when the node contains null.
     *
     * @param mixed $value
     *
     * @return $this
     */
    public function treatNullLike($value)
    {
        $this->nullEquivalent = $value;

        return $this;
    }

    /**
     * Sets the equivalent value used when the node contains true.
     *
     * @param mixed $value
     *
     * @return $this
     */
    public function treatTrueLike($value)
    {
        $this->trueEquivalent = $value;

        return $this;
    }

    /**
     * Sets the equivalent value used when the node contains false.
     *
     * @param mixed $value
     *
     * @return $this
     */
    public function treatFalseLike($value)
    {
        $this->falseEquivalent = $value;

        return $this;
    }

    /**
     * Sets null as the default value.
     *
     * @return $this
     */
    public function defaultNull()
    {
        return $this->defaultValue(null);
    }

    /**
     * Sets true as the default value.
     *
     * @return $this
     */
    public function defaultTrue()
    {
        return $this->defaultValue(true);
    }

    /**
     * Sets false as the default value.
     *
     * @return $this
     */
    public function defaultFalse()
    {
        return $this->defaultValue(false);
    }

    /**
     * Sets an expression to run before the normalization.
     *
     * @return ExprBuilder
     */
    public function beforeNormalization()
    {
        return $this->normalization()->before();
    }

    /**
     * Denies the node value being empty.
     *
     * @return $this
     */
    public function cannotBeEmpty()
    {
        $this->allowEmptyValue = false;

        return $this;
    }

    /**
     * Sets an expression to run for the validation.
     *
     * The expression receives the value of the node and must return it. It can
     * modify it.
     * An exception should be thrown when the node is not valid.
     *
     * @return ExprBuilder
     */
    public function validate()
    {
        return $this->validation()->rule();
    }

    /**
     * Sets whether the node can be overwritten.
     *
     * @param bool $deny Whether the overwriting is forbidden or not
     *
     * @return $this
     */
    public function cannotBeOverwritten($deny = true)
    {
        $this->merge()->denyOverwrite($deny);

        return $this;
    }

    /**
     * Gets the builder for validation rules.
     *
     * @return ValidationBuilder
     */
    protected function validation()
    {
        if (null === $this->validation) {
            $this->validation = new ValidationBuilder($this);
        }

        return $this->validation;
    }

    /**
     * Gets the builder for merging rules.
     *
     * @return MergeBuilder
     */
    protected function merge()
    {
        if (null === $this->merge) {
            $this->merge = new MergeBuilder($this);
        }

        return $this->merge;
    }

    /**
     * Gets the builder for normalization rules.
     *
     * @return NormalizationBuilder
     */
    protected function normalization()
    {
        if (null === $this->normalization) {
            $this->normalization = new NormalizationBuilder($this);
        }

        return $this->normalization;
    }

    /**
     * Instantiate and configure the node according to this definition.
     *
     * @return NodeInterface The node instance
     *
     * @throws InvalidDefinitionException When the definition is invalid
     */
    abstract protected function createNode();

    /**
     * Set PathSeparator to use.
     *
     * @return $this
     */
    public function setPathSeparator(string $separator)
    {
        if ($this instanceof ParentNodeDefinitionInterface) {
            if (method_exists($this, 'getChildNodeDefinitions')) {
                foreach ($this->getChildNodeDefinitions() as $child) {
                    $child->setPathSeparator($separator);
                }
            } else {
                @trigger_error(sprintf('Not implementing the "%s::getChildNodeDefinitions()" method in "%s" is deprecated since Symfony 4.1.', ParentNodeDefinitionInterface::class, \get_class($this)), E_USER_DEPRECATED);
            }
        }

        $this->pathSeparator = $separator;

        return $this;
    }
}
