<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Validator;

use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\Constraints\GroupSequence;
use Symfony\Component\Validator\ConstraintViolationListInterface;
use Symfony\Component\Validator\Context\ExecutionContextInterface;
use Symfony\Component\Validator\Mapping\Factory\MetadataFactoryInterface;

/**
 * Validates PHP values against constraints.
 *
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
interface ValidatorInterface extends MetadataFactoryInterface
{
    /**
     * Validates a value against a constraint or a list of constraints.
     *
     * If no constraint is passed, the constraint
     * {@link \Symfony\Component\Validator\Constraints\Valid} is assumed.
     *
     * @param mixed                                              $value       The value to validate
     * @param Constraint|Constraint[]                            $constraints The constraint(s) to validate against
     * @param string|GroupSequence|(string|GroupSequence)[]|null $groups      The validation groups to validate. If none is given, "Default" is assumed
     *
     * @return ConstraintViolationListInterface A list of constraint violations
     *                                          If the list is empty, validation
     *                                          succeeded
     */
    public function validate($value, $constraints = null, $groups = null);

    /**
     * Validates a property of an object against the constraints specified
     * for this property.
     *
     * @param object                                             $object       The object
     * @param string                                             $propertyName The name of the validated property
     * @param string|GroupSequence|(string|GroupSequence)[]|null $groups       The validation groups to validate. If none is given, "Default" is assumed
     *
     * @return ConstraintViolationListInterface A list of constraint violations
     *                                          If the list is empty, validation
     *                                          succeeded
     */
    public function validateProperty($object, $propertyName, $groups = null);

    /**
     * Validates a value against the constraints specified for an object's
     * property.
     *
     * @param object|string                                      $objectOrClass The object or its class name
     * @param string                                             $propertyName  The name of the property
     * @param mixed                                              $value         The value to validate against the property's constraints
     * @param string|GroupSequence|(string|GroupSequence)[]|null $groups        The validation groups to validate. If none is given, "Default" is assumed
     *
     * @return ConstraintViolationListInterface A list of constraint violations
     *                                          If the list is empty, validation
     *                                          succeeded
     */
    public function validatePropertyValue($objectOrClass, $propertyName, $value, $groups = null);

    /**
     * Starts a new validation context and returns a validator for that context.
     *
     * The returned validator collects all violations generated within its
     * context. You can access these violations with the
     * {@link ContextualValidatorInterface::getViolations()} method.
     *
     * @return ContextualValidatorInterface The validator for the new context
     */
    public function startContext();

    /**
     * Returns a validator in the given execution context.
     *
     * The returned validator adds all generated violations to the given
     * context.
     *
     * @return ContextualValidatorInterface The validator for that context
     */
    public function inContext(ExecutionContextInterface $context);
}
