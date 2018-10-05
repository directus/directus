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

use Symfony\Component\Validator\Constraints\Luhn;
use Symfony\Component\Validator\Constraints\LuhnValidator;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

class LuhnValidatorTest extends ConstraintValidatorTestCase
{
    protected function createValidator()
    {
        return new LuhnValidator();
    }

    public function testNullIsValid()
    {
        $this->validator->validate(null, new Luhn());

        $this->assertNoViolation();
    }

    public function testEmptyStringIsValid()
    {
        $this->validator->validate('', new Luhn());

        $this->assertNoViolation();
    }

    /**
     * @dataProvider getValidNumbers
     */
    public function testValidNumbers($number)
    {
        $this->validator->validate($number, new Luhn());

        $this->assertNoViolation();
    }

    public function getValidNumbers()
    {
        return array(
            array('42424242424242424242'),
            array('378282246310005'),
            array('371449635398431'),
            array('378734493671000'),
            array('5610591081018250'),
            array('30569309025904'),
            array('38520000023237'),
            array('6011111111111117'),
            array('6011000990139424'),
            array('3530111333300000'),
            array('3566002020360505'),
            array('5555555555554444'),
            array('5105105105105100'),
            array('4111111111111111'),
            array('4012888888881881'),
            array('4222222222222'),
            array('5019717010103742'),
            array('6331101999990016'),
        );
    }

    /**
     * @dataProvider getInvalidNumbers
     */
    public function testInvalidNumbers($number, $code)
    {
        $constraint = new Luhn(array(
            'message' => 'myMessage',
        ));

        $this->validator->validate($number, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$number.'"')
            ->setCode($code)
            ->assertRaised();
    }

    public function getInvalidNumbers()
    {
        return array(
            array('1234567812345678', Luhn::CHECKSUM_FAILED_ERROR),
            array('4222222222222222', Luhn::CHECKSUM_FAILED_ERROR),
            array('0000000000000000', Luhn::CHECKSUM_FAILED_ERROR),
            array('000000!000000000', Luhn::INVALID_CHARACTERS_ERROR),
            array('42-22222222222222', Luhn::INVALID_CHARACTERS_ERROR),
        );
    }

    /**
     * @expectedException \Symfony\Component\Validator\Exception\UnexpectedTypeException
     * @dataProvider getInvalidTypes
     */
    public function testInvalidTypes($number)
    {
        $constraint = new Luhn();

        $this->validator->validate($number, $constraint);
    }

    public function getInvalidTypes()
    {
        return array(
            array(0),
            array(123),
            array(42424242424242424242),
            array(378282246310005),
            array(371449635398431),
        );
    }
}
