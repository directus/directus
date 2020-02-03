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

use Symfony\Component\PropertyAccess\Exception\NoSuchPropertyException;
use Symfony\Component\PropertyAccess\PropertyAccess;
use Symfony\Component\PropertyAccess\PropertyAccessorInterface;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\ConstraintDefinitionException;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

/**
 * Provides a base class for the validation of property comparisons.
 *
 * @author Daniel Holmes <daniel@danielholmes.org>
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
abstract class AbstractComparisonValidator extends ConstraintValidator
{
    private $propertyAccessor;

    public function __construct(PropertyAccessorInterface $propertyAccessor = null)
    {
        $this->propertyAccessor = $propertyAccessor;
    }

    /**
     * {@inheritdoc}
     */
    public function validate($value, Constraint $constraint)
    {
        if (!$constraint instanceof AbstractComparison) {
            throw new UnexpectedTypeException($constraint, AbstractComparison::class);
        }

        if (null === $value) {
            return;
        }

        if ($path = $constraint->propertyPath) {
            if (null === $object = $this->context->getObject()) {
                return;
            }

            try {
                $comparedValue = $this->getPropertyAccessor()->getValue($object, $path);
            } catch (NoSuchPropertyException $e) {
                throw new ConstraintDefinitionException(sprintf('Invalid property path "%s" provided to "%s" constraint: %s', $path, \get_class($constraint), $e->getMessage()), 0, $e);
            }
        } else {
            $comparedValue = $constraint->value;
        }

        // Convert strings to DateTimes if comparing another DateTime
        // This allows to compare with any date/time value supported by
        // the DateTime constructor:
        // https://php.net/datetime.formats
        if (\is_string($comparedValue) && $value instanceof \DateTimeInterface) {
            // If $value is immutable, convert the compared value to a DateTimeImmutable too, otherwise use DateTime
            $dateTimeClass = $value instanceof \DateTimeImmutable ? \DateTimeImmutable::class : \DateTime::class;

            try {
                $comparedValue = new $dateTimeClass($comparedValue);
            } catch (\Exception $e) {
                throw new ConstraintDefinitionException(sprintf('The compared value "%s" could not be converted to a "%s" instance in the "%s" constraint.', $comparedValue, $dateTimeClass, \get_class($constraint)));
            }
        }

        if (!$this->compareValues($value, $comparedValue)) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ value }}', $this->formatValue($value, self::OBJECT_TO_STRING | self::PRETTY_DATE))
                ->setParameter('{{ compared_value }}', $this->formatValue($comparedValue, self::OBJECT_TO_STRING | self::PRETTY_DATE))
                ->setParameter('{{ compared_value_type }}', $this->formatTypeOf($comparedValue))
                ->setCode($this->getErrorCode())
                ->addViolation();
        }
    }

    private function getPropertyAccessor()
    {
        if (null === $this->propertyAccessor) {
            $this->propertyAccessor = PropertyAccess::createPropertyAccessor();
        }

        return $this->propertyAccessor;
    }

    /**
     * Compares the two given values to find if their relationship is valid.
     *
     * @param mixed $value1 The first value to compare
     * @param mixed $value2 The second value to compare
     *
     * @return bool true if the relationship is valid, false otherwise
     */
    abstract protected function compareValues($value1, $value2);

    /**
     * Returns the error code used if the comparison fails.
     *
     * @return string|null The error code or `null` if no code should be set
     */
    protected function getErrorCode()
    {
        return null;
    }
}
