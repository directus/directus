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

use Symfony\Component\Validator\Constraints\Length;
use Symfony\Component\Validator\Constraints\LengthValidator;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

class LengthValidatorTest extends ConstraintValidatorTestCase
{
    protected function createValidator()
    {
        return new LengthValidator();
    }

    public function testNullIsValid()
    {
        $this->validator->validate(null, new Length(6));

        $this->assertNoViolation();
    }

    public function testEmptyStringIsValid()
    {
        $this->validator->validate('', new Length(6));

        $this->assertNoViolation();
    }

    /**
     * @expectedException \Symfony\Component\Validator\Exception\UnexpectedTypeException
     */
    public function testExpectsStringCompatibleType()
    {
        $this->validator->validate(new \stdClass(), new Length(5));
    }

    public function getThreeOrLessCharacters()
    {
        return array(
            array(12),
            array('12'),
            array('üü'),
            array('éé'),
            array(123),
            array('123'),
            array('üüü'),
            array('ééé'),
        );
    }

    public function getFourCharacters()
    {
        return array(
            array(1234),
            array('1234'),
            array('üüüü'),
            array('éééé'),
        );
    }

    public function getFiveOrMoreCharacters()
    {
        return array(
            array(12345),
            array('12345'),
            array('üüüüü'),
            array('ééééé'),
            array(123456),
            array('123456'),
            array('üüüüüü'),
            array('éééééé'),
        );
    }

    public function getOneCharset()
    {
        return array(
            array('é', 'utf8', true),
            array("\xE9", 'CP1252', true),
            array("\xE9", 'XXX', false),
            array("\xE9", 'utf8', false),
        );
    }

    /**
     * @dataProvider getFiveOrMoreCharacters
     */
    public function testValidValuesMin($value)
    {
        $constraint = new Length(array('min' => 5));
        $this->validator->validate($value, $constraint);

        $this->assertNoViolation();
    }

    /**
     * @dataProvider getThreeOrLessCharacters
     */
    public function testValidValuesMax($value)
    {
        $constraint = new Length(array('max' => 3));
        $this->validator->validate($value, $constraint);

        $this->assertNoViolation();
    }

    /**
     * @dataProvider getFourCharacters
     */
    public function testValidValuesExact($value)
    {
        $constraint = new Length(4);
        $this->validator->validate($value, $constraint);

        $this->assertNoViolation();
    }

    /**
     * @dataProvider getThreeOrLessCharacters
     */
    public function testInvalidValuesMin($value)
    {
        $constraint = new Length(array(
            'min' => 4,
            'minMessage' => 'myMessage',
        ));

        $this->validator->validate($value, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$value.'"')
            ->setParameter('{{ limit }}', 4)
            ->setInvalidValue($value)
            ->setPlural(4)
            ->setCode(Length::TOO_SHORT_ERROR)
            ->assertRaised();
    }

    /**
     * @dataProvider getFiveOrMoreCharacters
     */
    public function testInvalidValuesMax($value)
    {
        $constraint = new Length(array(
            'max' => 4,
            'maxMessage' => 'myMessage',
        ));

        $this->validator->validate($value, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$value.'"')
            ->setParameter('{{ limit }}', 4)
            ->setInvalidValue($value)
            ->setPlural(4)
            ->setCode(Length::TOO_LONG_ERROR)
            ->assertRaised();
    }

    /**
     * @dataProvider getThreeOrLessCharacters
     */
    public function testInvalidValuesExactLessThanFour($value)
    {
        $constraint = new Length(array(
            'min' => 4,
            'max' => 4,
            'exactMessage' => 'myMessage',
        ));

        $this->validator->validate($value, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$value.'"')
            ->setParameter('{{ limit }}', 4)
            ->setInvalidValue($value)
            ->setPlural(4)
            ->setCode(Length::TOO_SHORT_ERROR)
            ->assertRaised();
    }

    /**
     * @dataProvider getFiveOrMoreCharacters
     */
    public function testInvalidValuesExactMoreThanFour($value)
    {
        $constraint = new Length(array(
            'min' => 4,
            'max' => 4,
            'exactMessage' => 'myMessage',
        ));

        $this->validator->validate($value, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$value.'"')
            ->setParameter('{{ limit }}', 4)
            ->setInvalidValue($value)
            ->setPlural(4)
            ->setCode(Length::TOO_LONG_ERROR)
            ->assertRaised();
    }

    /**
     * @dataProvider getOneCharset
     */
    public function testOneCharset($value, $charset, $isValid)
    {
        $constraint = new Length(array(
            'min' => 1,
            'max' => 1,
            'charset' => $charset,
            'charsetMessage' => 'myMessage',
        ));

        $this->validator->validate($value, $constraint);

        if ($isValid) {
            $this->assertNoViolation();
        } else {
            $this->buildViolation('myMessage')
                ->setParameter('{{ value }}', '"'.$value.'"')
                ->setParameter('{{ charset }}', $charset)
                ->setInvalidValue($value)
                ->setCode(Length::INVALID_CHARACTERS_ERROR)
                ->assertRaised();
        }
    }

    public function testConstraintGetDefaultOption()
    {
        $constraint = new Length(5);

        $this->assertEquals(5, $constraint->min);
        $this->assertEquals(5, $constraint->max);
    }
}
