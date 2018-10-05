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

/**
 * A violation of a constraint that happened during validation.
 *
 * For each constraint that fails during validation one or more violations are
 * created. The violations store the violation message, the path to the failing
 * element in the validation graph and the root element that was originally
 * passed to the validator. For example, take the following graph:
 *
 *     (Person)---(firstName: string)
 *          \
 *       (address: Address)---(street: string)
 *
 * If the <tt>Person</tt> object is validated and validation fails for the
 * "firstName" property, the generated violation has the <tt>Person</tt>
 * instance as root and the property path "firstName". If validation fails
 * for the "street" property of the related <tt>Address</tt> instance, the root
 * element is still the person, but the property path is "address.street".
 *
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
interface ConstraintViolationInterface
{
    /**
     * Returns the violation message.
     *
     * @return string The violation message
     */
    public function getMessage();

    /**
     * Returns the raw violation message.
     *
     * The raw violation message contains placeholders for the parameters
     * returned by {@link getParameters}. Typically you'll pass the
     * message template and parameters to a translation engine.
     *
     * @return string The raw violation message
     */
    public function getMessageTemplate();

    /**
     * Returns the parameters to be inserted into the raw violation message.
     *
     * @return array a possibly empty list of parameters indexed by the names
     *               that appear in the message template
     *
     * @see getMessageTemplate()
     */
    public function getParameters();

    /**
     * Returns a number for pluralizing the violation message.
     *
     * For example, the message template could have different translation based
     * on a parameter "choices":
     *
     * <ul>
     * <li>Please select exactly one entry. (choices=1)</li>
     * <li>Please select two entries. (choices=2)</li>
     * </ul>
     *
     * This method returns the value of the parameter for choosing the right
     * pluralization form (in this case "choices").
     *
     * @return int|null The number to use to pluralize of the message
     */
    public function getPlural();

    /**
     * Returns the root element of the validation.
     *
     * @return mixed The value that was passed originally to the validator when
     *               the validation was started. Because the validator traverses
     *               the object graph, the value at which the violation occurs
     *               is not necessarily the value that was originally validated.
     */
    public function getRoot();

    /**
     * Returns the property path from the root element to the violation.
     *
     * @return string The property path indicates how the validator reached
     *                the invalid value from the root element. If the root
     *                element is a <tt>Person</tt> instance with a property
     *                "address" that contains an <tt>Address</tt> instance
     *                with an invalid property "street", the generated property
     *                path is "address.street". Property access is denoted by
     *                dots, while array access is denoted by square brackets,
     *                for example "addresses[1].street".
     */
    public function getPropertyPath();

    /**
     * Returns the value that caused the violation.
     *
     * @return mixed the invalid value that caused the validated constraint to
     *               fail
     */
    public function getInvalidValue();

    /**
     * Returns a machine-digestible error code for the violation.
     *
     * @return string|null The error code
     */
    public function getCode();
}
