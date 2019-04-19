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

use Symfony\Component\Validator\Constraints\Count;
use Symfony\Component\Validator\Constraints\CountValidator;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

/**
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
abstract class CountValidatorTest extends ConstraintValidatorTestCase
{
    protected function createValidator()
    {
        return new CountValidator();
    }

    abstract protected function createCollection(array $content);

    public function testNullIsValid()
    {
        $this->validator->validate(null, new Count(6));

        $this->assertNoViolation();
    }

    /**
     * @expectedException \Symfony\Component\Validator\Exception\UnexpectedTypeException
     */
    public function testExpectsCountableType()
    {
        $this->validator->validate(new \stdClass(), new Count(5));
    }

    public function getThreeOrLessElements()
    {
        return [
            [$this->createCollection([1])],
            [$this->createCollection([1, 2])],
            [$this->createCollection([1, 2, 3])],
            [$this->createCollection(['a' => 1, 'b' => 2, 'c' => 3])],
        ];
    }

    public function getFourElements()
    {
        return [
            [$this->createCollection([1, 2, 3, 4])],
            [$this->createCollection(['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4])],
        ];
    }

    public function getFiveOrMoreElements()
    {
        return [
            [$this->createCollection([1, 2, 3, 4, 5])],
            [$this->createCollection([1, 2, 3, 4, 5, 6])],
            [$this->createCollection(['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4, 'e' => 5])],
        ];
    }

    /**
     * @dataProvider getThreeOrLessElements
     */
    public function testValidValuesMax($value)
    {
        $constraint = new Count(['max' => 3]);
        $this->validator->validate($value, $constraint);

        $this->assertNoViolation();
    }

    /**
     * @dataProvider getFiveOrMoreElements
     */
    public function testValidValuesMin($value)
    {
        $constraint = new Count(['min' => 5]);
        $this->validator->validate($value, $constraint);

        $this->assertNoViolation();
    }

    /**
     * @dataProvider getFourElements
     */
    public function testValidValuesExact($value)
    {
        $constraint = new Count(4);
        $this->validator->validate($value, $constraint);

        $this->assertNoViolation();
    }

    /**
     * @dataProvider getFiveOrMoreElements
     */
    public function testTooManyValues($value)
    {
        $constraint = new Count([
            'max' => 4,
            'maxMessage' => 'myMessage',
        ]);

        $this->validator->validate($value, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ count }}', \count($value))
            ->setParameter('{{ limit }}', 4)
            ->setInvalidValue($value)
            ->setPlural(4)
            ->setCode(Count::TOO_MANY_ERROR)
            ->assertRaised();
    }

    /**
     * @dataProvider getThreeOrLessElements
     */
    public function testTooFewValues($value)
    {
        $constraint = new Count([
            'min' => 4,
            'minMessage' => 'myMessage',
        ]);

        $this->validator->validate($value, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ count }}', \count($value))
            ->setParameter('{{ limit }}', 4)
            ->setInvalidValue($value)
            ->setPlural(4)
            ->setCode(Count::TOO_FEW_ERROR)
            ->assertRaised();
    }

    /**
     * @dataProvider getFiveOrMoreElements
     */
    public function testTooManyValuesExact($value)
    {
        $constraint = new Count([
            'min' => 4,
            'max' => 4,
            'exactMessage' => 'myMessage',
        ]);

        $this->validator->validate($value, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ count }}', \count($value))
            ->setParameter('{{ limit }}', 4)
            ->setInvalidValue($value)
            ->setPlural(4)
            ->setCode(Count::TOO_MANY_ERROR)
            ->assertRaised();
    }

    /**
     * @dataProvider getThreeOrLessElements
     */
    public function testTooFewValuesExact($value)
    {
        $constraint = new Count([
            'min' => 4,
            'max' => 4,
            'exactMessage' => 'myMessage',
        ]);

        $this->validator->validate($value, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ count }}', \count($value))
            ->setParameter('{{ limit }}', 4)
            ->setInvalidValue($value)
            ->setPlural(4)
            ->setCode(Count::TOO_FEW_ERROR)
            ->assertRaised();
    }

    public function testDefaultOption()
    {
        $constraint = new Count(5);

        $this->assertEquals(5, $constraint->min);
        $this->assertEquals(5, $constraint->max);
    }

    public function testConstraintAnnotationDefaultOption()
    {
        $constraint = new Count(['value' => 5, 'exactMessage' => 'message']);

        $this->assertEquals(5, $constraint->min);
        $this->assertEquals(5, $constraint->max);
        $this->assertEquals('message', $constraint->exactMessage);
    }
}
