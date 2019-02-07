<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Config\Definition;

use Symfony\Component\Config\Definition\Exception\InvalidConfigurationException;

/**
 * Node which only allows a finite set of values.
 *
 * @author Johannes M. Schmitt <schmittjoh@gmail.com>
 */
class EnumNode extends ScalarNode
{
    private $values;

    public function __construct(?string $name, NodeInterface $parent = null, array $values = [], string $pathSeparator = BaseNode::DEFAULT_PATH_SEPARATOR)
    {
        $values = array_unique($values);
        if (empty($values)) {
            throw new \InvalidArgumentException('$values must contain at least one element.');
        }

        parent::__construct($name, $parent, $pathSeparator);
        $this->values = $values;
    }

    public function getValues()
    {
        return $this->values;
    }

    protected function finalizeValue($value)
    {
        $value = parent::finalizeValue($value);

        if (!\in_array($value, $this->values, true)) {
            $ex = new InvalidConfigurationException(sprintf('The value %s is not allowed for path "%s". Permissible values: %s', json_encode($value), $this->getPath(), implode(', ', array_map('json_encode', $this->values))));
            $ex->setPath($this->getPath());

            throw $ex;
        }

        return $value;
    }

    /**
     * {@inheritdoc}
     */
    protected function allowPlaceholders(): bool
    {
        return false;
    }
}
