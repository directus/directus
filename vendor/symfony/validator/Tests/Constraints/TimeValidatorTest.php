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

use Symfony\Component\Validator\Constraints\Time;
use Symfony\Component\Validator\Constraints\TimeValidator;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

class TimeValidatorTest extends ConstraintValidatorTestCase
{
    protected function createValidator()
    {
        return new TimeValidator();
    }

    public function testNullIsValid()
    {
        $this->validator->validate(null, new Time());

        $this->assertNoViolation();
    }

    public function testEmptyStringIsValid()
    {
        $this->validator->validate('', new Time());

        $this->assertNoViolation();
    }

    public function testDateTimeClassIsValid()
    {
        $this->validator->validate(new \DateTime(), new Time());

        $this->assertNoViolation();
    }

    /**
     * @expectedException \Symfony\Component\Validator\Exception\UnexpectedTypeException
     */
    public function testExpectsStringCompatibleType()
    {
        $this->validator->validate(new \stdClass(), new Time());
    }

    /**
     * @dataProvider getValidTimes
     */
    public function testValidTimes($time)
    {
        $this->validator->validate($time, new Time());

        $this->assertNoViolation();
    }

    public function getValidTimes()
    {
        return array(
            array('01:02:03'),
            array('00:00:00'),
            array('23:59:59'),
        );
    }

    /**
     * @dataProvider getInvalidTimes
     */
    public function testInvalidTimes($time, $code)
    {
        $constraint = new Time(array(
            'message' => 'myMessage',
        ));

        $this->validator->validate($time, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$time.'"')
            ->setCode($code)
            ->assertRaised();
    }

    public function getInvalidTimes()
    {
        return array(
            array('foobar', Time::INVALID_FORMAT_ERROR),
            array('foobar 12:34:56', Time::INVALID_FORMAT_ERROR),
            array('12:34:56 foobar', Time::INVALID_FORMAT_ERROR),
            array('00:00', Time::INVALID_FORMAT_ERROR),
            array('24:00:00', Time::INVALID_TIME_ERROR),
            array('00:60:00', Time::INVALID_TIME_ERROR),
            array('00:00:60', Time::INVALID_TIME_ERROR),
        );
    }

    public function testDateTimeImmutableIsValid()
    {
        $this->validator->validate(new \DateTimeImmutable(), new Time());

        $this->assertNoViolation();
    }
}
