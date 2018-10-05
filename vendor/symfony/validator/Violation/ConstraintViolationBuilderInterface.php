<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Violation;

/**
 * Builds {@link \Symfony\Component\Validator\ConstraintViolationInterface}
 * objects.
 *
 * Use the various methods on this interface to configure the built violation.
 * Finally, call {@link addViolation()} to add the violation to the current
 * execution context.
 *
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
interface ConstraintViolationBuilderInterface
{
    /**
     * Stores the property path at which the violation should be generated.
     *
     * The passed path will be appended to the current property path of the
     * execution context.
     *
     * @param string $path The property path
     *
     * @return $this
     */
    public function atPath($path);

    /**
     * Sets a parameter to be inserted into the violation message.
     *
     * @param string $key   The name of the parameter
     * @param string $value The value to be inserted in the parameter's place
     *
     * @return $this
     */
    public function setParameter($key, $value);

    /**
     * Sets all parameters to be inserted into the violation message.
     *
     * @param array $parameters An array with the parameter names as keys and
     *                          the values to be inserted in their place as
     *                          values
     *
     * @return $this
     */
    public function setParameters(array $parameters);

    /**
     * Sets the translation domain which should be used for translating the
     * violation message.
     *
     * @param string $translationDomain The translation domain
     *
     * @return $this
     *
     * @see \Symfony\Component\Translation\TranslatorInterface
     */
    public function setTranslationDomain($translationDomain);

    /**
     * Sets the invalid value that caused this violation.
     *
     * @param mixed $invalidValue The invalid value
     *
     * @return $this
     */
    public function setInvalidValue($invalidValue);

    /**
     * Sets the number which determines how the plural form of the violation
     * message is chosen when it is translated.
     *
     * @param int $number The number for determining the plural form
     *
     * @return $this
     *
     * @see \Symfony\Component\Translation\TranslatorInterface::transChoice()
     */
    public function setPlural($number);

    /**
     * Sets the violation code.
     *
     * @param string|null $code The violation code
     *
     * @return $this
     */
    public function setCode($code);

    /**
     * Sets the cause of the violation.
     *
     * @param mixed $cause The cause of the violation
     *
     * @return $this
     */
    public function setCause($cause);

    /**
     * Adds the violation to the current execution context.
     */
    public function addViolation();
}
