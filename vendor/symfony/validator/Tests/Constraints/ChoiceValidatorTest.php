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

use Symfony\Component\Validator\Constraints\Choice;
use Symfony\Component\Validator\Constraints\ChoiceValidator;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

function choice_callback()
{
    return ['foo', 'bar'];
}

class ChoiceValidatorTest extends ConstraintValidatorTestCase
{
    protected function createValidator()
    {
        return new ChoiceValidator();
    }

    public static function staticCallback()
    {
        return ['foo', 'bar'];
    }

    public function objectMethodCallback()
    {
        return ['foo', 'bar'];
    }

    public function testExpectArrayIfMultipleIsTrue()
    {
        $this->expectException('Symfony\Component\Validator\Exception\UnexpectedTypeException');
        $constraint = new Choice([
            'choices' => ['foo', 'bar'],
            'multiple' => true,
            'strict' => true,
        ]);

        $this->validator->validate('asdf', $constraint);
    }

    public function testNullIsValid()
    {
        $this->validator->validate(
            null,
            new Choice([
                'choices' => ['foo', 'bar'],
                'strict' => true,
            ])
        );

        $this->assertNoViolation();
    }

    public function testChoicesOrCallbackExpected()
    {
        $this->expectException('Symfony\Component\Validator\Exception\ConstraintDefinitionException');
        $this->validator->validate('foobar', new Choice(['strict' => true]));
    }

    public function testValidCallbackExpected()
    {
        $this->expectException('Symfony\Component\Validator\Exception\ConstraintDefinitionException');
        $this->validator->validate('foobar', new Choice(['callback' => 'abcd', 'strict' => true]));
    }

    public function testValidChoiceArray()
    {
        $constraint = new Choice(['choices' => ['foo', 'bar'], 'strict' => true]);

        $this->validator->validate('bar', $constraint);

        $this->assertNoViolation();
    }

    public function testValidChoiceCallbackFunction()
    {
        $constraint = new Choice(['callback' => __NAMESPACE__.'\choice_callback', 'strict' => true]);

        $this->validator->validate('bar', $constraint);

        $this->assertNoViolation();
    }

    public function testValidChoiceCallbackClosure()
    {
        $constraint = new Choice([
            'strict' => true,
            'callback' => function () {
                return ['foo', 'bar'];
            },
        ]);

        $this->validator->validate('bar', $constraint);

        $this->assertNoViolation();
    }

    public function testValidChoiceCallbackStaticMethod()
    {
        $constraint = new Choice(['callback' => [__CLASS__, 'staticCallback'], 'strict' => true]);

        $this->validator->validate('bar', $constraint);

        $this->assertNoViolation();
    }

    public function testValidChoiceCallbackContextMethod()
    {
        // search $this for "staticCallback"
        $this->setObject($this);

        $constraint = new Choice(['callback' => 'staticCallback', 'strict' => true]);

        $this->validator->validate('bar', $constraint);

        $this->assertNoViolation();
    }

    public function testValidChoiceCallbackContextObjectMethod()
    {
        // search $this for "objectMethodCallback"
        $this->setObject($this);

        $constraint = new Choice(['callback' => 'objectMethodCallback', 'strict' => true]);

        $this->validator->validate('bar', $constraint);

        $this->assertNoViolation();
    }

    public function testMultipleChoices()
    {
        $constraint = new Choice([
            'choices' => ['foo', 'bar', 'baz'],
            'multiple' => true,
            'strict' => true,
        ]);

        $this->validator->validate(['baz', 'bar'], $constraint);

        $this->assertNoViolation();
    }

    public function testInvalidChoice()
    {
        $constraint = new Choice([
            'choices' => ['foo', 'bar'],
            'message' => 'myMessage',
            'strict' => true,
        ]);

        $this->validator->validate('baz', $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"baz"')
            ->setCode(Choice::NO_SUCH_CHOICE_ERROR)
            ->assertRaised();
    }

    public function testInvalidChoiceEmptyChoices()
    {
        $constraint = new Choice([
            // May happen when the choices are provided dynamically, e.g. from
            // the DB or the model
            'choices' => [],
            'message' => 'myMessage',
            'strict' => true,
        ]);

        $this->validator->validate('baz', $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"baz"')
            ->setCode(Choice::NO_SUCH_CHOICE_ERROR)
            ->assertRaised();
    }

    public function testInvalidChoiceMultiple()
    {
        $constraint = new Choice([
            'choices' => ['foo', 'bar'],
            'multipleMessage' => 'myMessage',
            'multiple' => true,
            'strict' => true,
        ]);

        $this->validator->validate(['foo', 'baz'], $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"baz"')
            ->setInvalidValue('baz')
            ->setCode(Choice::NO_SUCH_CHOICE_ERROR)
            ->assertRaised();
    }

    public function testTooFewChoices()
    {
        $constraint = new Choice([
            'choices' => ['foo', 'bar', 'moo', 'maa'],
            'multiple' => true,
            'min' => 2,
            'minMessage' => 'myMessage',
            'strict' => true,
        ]);

        $value = ['foo'];

        $this->setValue($value);

        $this->validator->validate($value, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ limit }}', 2)
            ->setInvalidValue($value)
            ->setPlural(2)
            ->setCode(Choice::TOO_FEW_ERROR)
            ->assertRaised();
    }

    public function testTooManyChoices()
    {
        $constraint = new Choice([
            'choices' => ['foo', 'bar', 'moo', 'maa'],
            'multiple' => true,
            'max' => 2,
            'maxMessage' => 'myMessage',
            'strict' => true,
        ]);

        $value = ['foo', 'bar', 'moo'];

        $this->setValue($value);

        $this->validator->validate($value, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ limit }}', 2)
            ->setInvalidValue($value)
            ->setPlural(2)
            ->setCode(Choice::TOO_MANY_ERROR)
            ->assertRaised();
    }

    /**
     * @group legacy
     */
    public function testNonStrict()
    {
        $constraint = new Choice([
            'choices' => [1, 2],
            'strict' => false,
        ]);

        $this->validator->validate('2', $constraint);
        $this->validator->validate(2, $constraint);

        $this->assertNoViolation();
    }

    public function testStrictAllowsExactValue()
    {
        $constraint = new Choice([
            'choices' => [1, 2],
            'strict' => true,
        ]);

        $this->validator->validate(2, $constraint);

        $this->assertNoViolation();
    }

    public function testStrictDisallowsDifferentType()
    {
        $constraint = new Choice([
            'choices' => [1, 2],
            'strict' => true,
            'message' => 'myMessage',
        ]);

        $this->validator->validate('2', $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"2"')
            ->setCode(Choice::NO_SUCH_CHOICE_ERROR)
            ->assertRaised();
    }

    /**
     * @group legacy
     */
    public function testNonStrictWithMultipleChoices()
    {
        $constraint = new Choice([
            'choices' => [1, 2, 3],
            'multiple' => true,
            'strict' => false,
        ]);

        $this->validator->validate(['2', 3], $constraint);

        $this->assertNoViolation();
    }

    public function testStrictWithMultipleChoices()
    {
        $constraint = new Choice([
            'choices' => [1, 2, 3],
            'multiple' => true,
            'strict' => true,
            'multipleMessage' => 'myMessage',
        ]);

        $this->validator->validate([2, '3'], $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"3"')
            ->setInvalidValue('3')
            ->setCode(Choice::NO_SUCH_CHOICE_ERROR)
            ->assertRaised();
    }
}
