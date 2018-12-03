<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator;

use Symfony\Component\Validator\Exception\ConstraintDefinitionException;
use Symfony\Component\Validator\Exception\InvalidArgumentException;
use Symfony\Component\Validator\Exception\InvalidOptionsException;
use Symfony\Component\Validator\Exception\MissingOptionsException;

/**
 * Contains the properties of a constraint definition.
 *
 * A constraint can be defined on a class, a property or a getter method.
 * The Constraint class encapsulates all the configuration required for
 * validating this class, property or getter result successfully.
 *
 * Constraint instances are immutable and serializable.
 *
 * @property array $groups The groups that the constraint belongs to
 *
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
abstract class Constraint
{
    /**
     * The name of the group given to all constraints with no explicit group.
     */
    const DEFAULT_GROUP = 'Default';

    /**
     * Marks a constraint that can be put onto classes.
     */
    const CLASS_CONSTRAINT = 'class';

    /**
     * Marks a constraint that can be put onto properties.
     */
    const PROPERTY_CONSTRAINT = 'property';

    /**
     * Maps error codes to the names of their constants.
     */
    protected static $errorNames = array();

    /**
     * Domain-specific data attached to a constraint.
     *
     * @var mixed
     */
    public $payload;

    /**
     * Returns the name of the given error code.
     *
     * @param string $errorCode The error code
     *
     * @return string The name of the error code
     *
     * @throws InvalidArgumentException If the error code does not exist
     */
    public static function getErrorName($errorCode)
    {
        if (!isset(static::$errorNames[$errorCode])) {
            throw new InvalidArgumentException(sprintf('The error code "%s" does not exist for constraint of type "%s".', $errorCode, \get_called_class()));
        }

        return static::$errorNames[$errorCode];
    }

    /**
     * Initializes the constraint with options.
     *
     * You should pass an associative array. The keys should be the names of
     * existing properties in this class. The values should be the value for these
     * properties.
     *
     * Alternatively you can override the method getDefaultOption() to return the
     * name of an existing property. If no associative array is passed, this
     * property is set instead.
     *
     * You can force that certain options are set by overriding
     * getRequiredOptions() to return the names of these options. If any
     * option is not set here, an exception is thrown.
     *
     * @param mixed $options The options (as associative array)
     *                       or the value for the default
     *                       option (any other type)
     *
     * @throws InvalidOptionsException       When you pass the names of non-existing
     *                                       options
     * @throws MissingOptionsException       When you don't pass any of the options
     *                                       returned by getRequiredOptions()
     * @throws ConstraintDefinitionException When you don't pass an associative
     *                                       array, but getDefaultOption() returns
     *                                       null
     */
    public function __construct($options = null)
    {
        $invalidOptions = array();
        $missingOptions = array_flip((array) $this->getRequiredOptions());
        $knownOptions = get_object_vars($this);

        // The "groups" option is added to the object lazily
        $knownOptions['groups'] = true;

        if (\is_array($options) && \count($options) >= 1 && isset($options['value']) && !property_exists($this, 'value')) {
            $options[$this->getDefaultOption()] = $options['value'];
            unset($options['value']);
        }

        if (\is_array($options)) {
            reset($options);
        }
        if ($options && \is_array($options) && \is_string(key($options))) {
            foreach ($options as $option => $value) {
                if (array_key_exists($option, $knownOptions)) {
                    $this->$option = $value;
                    unset($missingOptions[$option]);
                } else {
                    $invalidOptions[] = $option;
                }
            }
        } elseif (null !== $options && !(\is_array($options) && 0 === \count($options))) {
            $option = $this->getDefaultOption();

            if (null === $option) {
                throw new ConstraintDefinitionException(sprintf('No default option is configured for constraint %s', \get_class($this)));
            }

            if (array_key_exists($option, $knownOptions)) {
                $this->$option = $options;
                unset($missingOptions[$option]);
            } else {
                $invalidOptions[] = $option;
            }
        }

        if (\count($invalidOptions) > 0) {
            throw new InvalidOptionsException(sprintf('The options "%s" do not exist in constraint %s', implode('", "', $invalidOptions), \get_class($this)), $invalidOptions);
        }

        if (\count($missingOptions) > 0) {
            throw new MissingOptionsException(sprintf('The options "%s" must be set for constraint %s', implode('", "', array_keys($missingOptions)), \get_class($this)), array_keys($missingOptions));
        }
    }

    /**
     * Sets the value of a lazily initialized option.
     *
     * Corresponding properties are added to the object on first access. Hence
     * this method will be called at most once per constraint instance and
     * option name.
     *
     * @param string $option The option name
     * @param mixed  $value  The value to set
     *
     * @throws InvalidOptionsException If an invalid option name is given
     */
    public function __set($option, $value)
    {
        if ('groups' === $option) {
            $this->groups = (array) $value;

            return;
        }

        throw new InvalidOptionsException(sprintf('The option "%s" does not exist in constraint %s', $option, \get_class($this)), array($option));
    }

    /**
     * Returns the value of a lazily initialized option.
     *
     * Corresponding properties are added to the object on first access. Hence
     * this method will be called at most once per constraint instance and
     * option name.
     *
     * @param string $option The option name
     *
     * @return mixed The value of the option
     *
     * @throws InvalidOptionsException If an invalid option name is given
     *
     * @internal this method should not be used or overwritten in userland code
     */
    public function __get($option)
    {
        if ('groups' === $option) {
            $this->groups = array(self::DEFAULT_GROUP);

            return $this->groups;
        }

        throw new InvalidOptionsException(sprintf('The option "%s" does not exist in constraint %s', $option, \get_class($this)), array($option));
    }

    /**
     * @param string $option The option name
     *
     * @return bool
     */
    public function __isset($option)
    {
        return 'groups' === $option;
    }

    /**
     * Adds the given group if this constraint is in the Default group.
     *
     * @param string $group
     */
    public function addImplicitGroupName($group)
    {
        if (\in_array(self::DEFAULT_GROUP, $this->groups) && !\in_array($group, $this->groups)) {
            $this->groups[] = $group;
        }
    }

    /**
     * Returns the name of the default option.
     *
     * Override this method to define a default option.
     *
     * @return string
     *
     * @see __construct()
     */
    public function getDefaultOption()
    {
    }

    /**
     * Returns the name of the required options.
     *
     * Override this method if you want to define required options.
     *
     * @return array
     *
     * @see __construct()
     */
    public function getRequiredOptions()
    {
        return array();
    }

    /**
     * Returns the name of the class that validates this constraint.
     *
     * By default, this is the fully qualified name of the constraint class
     * suffixed with "Validator". You can override this method to change that
     * behaviour.
     *
     * @return string
     */
    public function validatedBy()
    {
        return \get_class($this).'Validator';
    }

    /**
     * Returns whether the constraint can be put onto classes, properties or
     * both.
     *
     * This method should return one or more of the constants
     * Constraint::CLASS_CONSTRAINT and Constraint::PROPERTY_CONSTRAINT.
     *
     * @return string|array One or more constant values
     */
    public function getTargets()
    {
        return self::PROPERTY_CONSTRAINT;
    }

    /**
     * Optimizes the serialized value to minimize storage space.
     *
     * @return array The properties to serialize
     *
     * @internal This method may be replaced by an implementation of
     *           {@link \Serializable} in the future. Please don't use or
     *           overwrite it.
     */
    public function __sleep()
    {
        // Initialize "groups" option if it is not set
        $this->groups;

        return array_keys(get_object_vars($this));
    }
}
