<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Constraints;

use Symfony\Component\PropertyAccess\PropertyAccess;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\Exception\ConstraintDefinitionException;

/**
 * Used for the comparison of values.
 *
 * @author Daniel Holmes <daniel@danielholmes.org>
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
abstract class AbstractComparison extends Constraint
{
    public $message;
    public $value;
    public $propertyPath;

    /**
     * {@inheritdoc}
     */
    public function __construct($options = null)
    {
        if (null === $options) {
            $options = array();
        }

        if (\is_array($options)) {
            if (!isset($options['value']) && !isset($options['propertyPath'])) {
                throw new ConstraintDefinitionException(sprintf('The "%s" constraint requires either the "value" or "propertyPath" option to be set.', \get_class($this)));
            }

            if (isset($options['value']) && isset($options['propertyPath'])) {
                throw new ConstraintDefinitionException(sprintf('The "%s" constraint requires only one of the "value" or "propertyPath" options to be set, not both.', \get_class($this)));
            }

            if (isset($options['propertyPath']) && !class_exists(PropertyAccess::class)) {
                throw new ConstraintDefinitionException(sprintf('The "%s" constraint requires the Symfony PropertyAccess component to use the "propertyPath" option.', \get_class($this)));
            }
        }

        parent::__construct($options);
    }

    /**
     * {@inheritdoc}
     */
    public function getDefaultOption()
    {
        return 'value';
    }
}
