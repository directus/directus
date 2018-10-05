<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Tests\Constraints;

use Symfony\Component\Intl\Util\IntlTestHelper;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\Exception\ConstraintDefinitionException;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

class ComparisonTest_Class
{
    protected $value;

    public function __construct($value)
    {
        $this->value = $value;
    }

    public function __toString()
    {
        return (string) $this->value;
    }

    public function getValue()
    {
        return $this->value;
    }
}

/**
 * @author Daniel Holmes <daniel@danielholmes.org>
 */
abstract class AbstractComparisonValidatorTestCase extends ConstraintValidatorTestCase
{
    protected static function addPhp5Dot5Comparisons(array $comparisons)
    {
        $result = $comparisons;

        // Duplicate all tests involving DateTime objects to be tested with
        // DateTimeImmutable objects as well
        foreach ($comparisons as $comparison) {
            $add = false;

            foreach ($comparison as $i => $value) {
                if ($value instanceof \DateTime) {
                    $comparison[$i] = new \DateTimeImmutable(
                        $value->format('Y-m-d H:i:s.u e'),
                        $value->getTimezone()
                    );
                    $add = true;
                } elseif ('DateTime' === $value) {
                    $comparison[$i] = 'DateTimeImmutable';
                    $add = true;
                }
            }

            if ($add) {
                $result[] = $comparison;
            }
        }

        return $result;
    }

    public function provideInvalidConstraintOptions()
    {
        return array(
            array(null),
            array(array()),
        );
    }

    /**
     * @dataProvider provideInvalidConstraintOptions
     * @expectedException \Symfony\Component\Validator\Exception\ConstraintDefinitionException
     * @expectedExceptionMessage requires either the "value" or "propertyPath" option to be set.
     */
    public function testThrowsConstraintExceptionIfNoValueOrPropertyPath($options)
    {
        $this->createConstraint($options);
    }

    /**
     * @expectedException \Symfony\Component\Validator\Exception\ConstraintDefinitionException
     * @expectedExceptionMessage requires only one of the "value" or "propertyPath" options to be set, not both.
     */
    public function testThrowsConstraintExceptionIfBothValueAndPropertyPath()
    {
        $this->createConstraint((array(
            'value' => 'value',
            'propertyPath' => 'propertyPath',
        )));
    }

    /**
     * @dataProvider provideAllValidComparisons
     *
     * @param mixed $dirtyValue
     * @param mixed $comparisonValue
     */
    public function testValidComparisonToValue($dirtyValue, $comparisonValue)
    {
        $constraint = $this->createConstraint(array('value' => $comparisonValue));

        $this->validator->validate($dirtyValue, $constraint);

        $this->assertNoViolation();
    }

    /**
     * @return array
     */
    public function provideAllValidComparisons()
    {
        // The provider runs before setUp(), so we need to manually fix
        // the default timezone
        $this->setDefaultTimezone('UTC');

        $comparisons = self::addPhp5Dot5Comparisons($this->provideValidComparisons());

        $this->restoreDefaultTimezone();

        return $comparisons;
    }

    /**
     * @dataProvider provideValidComparisonsToPropertyPath
     */
    public function testValidComparisonToPropertyPath($comparedValue)
    {
        $constraint = $this->createConstraint(array('propertyPath' => 'value'));

        $object = new ComparisonTest_Class(5);

        $this->setObject($object);

        $this->validator->validate($comparedValue, $constraint);

        $this->assertNoViolation();
    }

    /**
     * @dataProvider provideValidComparisonsToPropertyPath
     */
    public function testValidComparisonToPropertyPathOnArray($comparedValue)
    {
        $constraint = $this->createConstraint(array('propertyPath' => '[root][value]'));

        $this->setObject(array('root' => array('value' => 5)));

        $this->validator->validate($comparedValue, $constraint);

        $this->assertNoViolation();
    }

    public function testNoViolationOnNullObjectWithPropertyPath()
    {
        $constraint = $this->createConstraint(array('propertyPath' => 'propertyPath'));

        $this->setObject(null);

        $this->validator->validate('some data', $constraint);

        $this->assertNoViolation();
    }

    public function testInvalidValuePath()
    {
        $constraint = $this->createConstraint(array('propertyPath' => 'foo'));

        if (method_exists($this, 'expectException')) {
            $this->expectException(ConstraintDefinitionException::class);
            $this->expectExceptionMessage(sprintf('Invalid property path "foo" provided to "%s" constraint', \get_class($constraint)));
        } else {
            $this->setExpectedException(ConstraintDefinitionException::class, sprintf('Invalid property path "foo" provided to "%s" constraint', \get_class($constraint)));
        }

        $object = new ComparisonTest_Class(5);

        $this->setObject($object);

        $this->validator->validate(5, $constraint);
    }

    /**
     * @return array
     */
    abstract public function provideValidComparisons();

    /**
     * @return array
     */
    abstract public function provideValidComparisonsToPropertyPath();

    /**
     * @dataProvider provideAllInvalidComparisons
     *
     * @param mixed  $dirtyValue
     * @param mixed  $dirtyValueAsString
     * @param mixed  $comparedValue
     * @param mixed  $comparedValueString
     * @param string $comparedValueType
     */
    public function testInvalidComparisonToValue($dirtyValue, $dirtyValueAsString, $comparedValue, $comparedValueString, $comparedValueType)
    {
        // Conversion of dates to string differs between ICU versions
        // Make sure we have the correct version loaded
        if ($dirtyValue instanceof \DateTime || $dirtyValue instanceof \DateTimeInterface) {
            IntlTestHelper::requireIntl($this, '57.1');
        }

        $constraint = $this->createConstraint(array('value' => $comparedValue));
        $constraint->message = 'Constraint Message';

        $this->validator->validate($dirtyValue, $constraint);

        $this->buildViolation('Constraint Message')
            ->setParameter('{{ value }}', $dirtyValueAsString)
            ->setParameter('{{ compared_value }}', $comparedValueString)
            ->setParameter('{{ compared_value_type }}', $comparedValueType)
            ->setCode($this->getErrorCode())
            ->assertRaised();
    }

    /**
     * @return array
     */
    public function provideAllInvalidComparisons()
    {
        // The provider runs before setUp(), so we need to manually fix
        // the default timezone
        $this->setDefaultTimezone('UTC');

        $comparisons = self::addPhp5Dot5Comparisons($this->provideInvalidComparisons());

        $this->restoreDefaultTimezone();

        return $comparisons;
    }

    /**
     * @return array
     */
    abstract public function provideInvalidComparisons();

    /**
     * @param array|null $options Options for the constraint
     *
     * @return Constraint
     */
    abstract protected function createConstraint(array $options = null);

    /**
     * @return string|null
     */
    protected function getErrorCode()
    {
    }
}
