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

use Symfony\Component\Validator\Constraints\Isbn;
use Symfony\Component\Validator\Constraints\IsbnValidator;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

/**
 * @see https://en.wikipedia.org/wiki/Isbn
 */
class IsbnValidatorTest extends ConstraintValidatorTestCase
{
    protected function createValidator()
    {
        return new IsbnValidator();
    }

    public function getValidIsbn10()
    {
        return array(
            array('2723442284'),
            array('2723442276'),
            array('2723455041'),
            array('2070546810'),
            array('2711858839'),
            array('2756406767'),
            array('2870971648'),
            array('226623854X'),
            array('2851806424'),
            array('0321812700'),
            array('0-45122-5244'),
            array('0-4712-92311'),
            array('0-9752298-0-X'),
        );
    }

    public function getInvalidIsbn10()
    {
        return array(
            array('27234422841', Isbn::TOO_LONG_ERROR),
            array('272344228', Isbn::TOO_SHORT_ERROR),
            array('0-4712-9231', Isbn::TOO_SHORT_ERROR),
            array('1234567890', Isbn::CHECKSUM_FAILED_ERROR),
            array('0987656789', Isbn::CHECKSUM_FAILED_ERROR),
            array('7-35622-5444', Isbn::CHECKSUM_FAILED_ERROR),
            array('0-4X19-92611', Isbn::CHECKSUM_FAILED_ERROR),
            array('0_45122_5244', Isbn::INVALID_CHARACTERS_ERROR),
            array('2870#971#648', Isbn::INVALID_CHARACTERS_ERROR),
            array('0-9752298-0-x', Isbn::INVALID_CHARACTERS_ERROR),
            array('1A34567890', Isbn::INVALID_CHARACTERS_ERROR),
            // chr(1) evaluates to 0
            // 2070546810 is valid
            array('2'.\chr(1).'70546810', Isbn::INVALID_CHARACTERS_ERROR),
        );
    }

    public function getValidIsbn13()
    {
        return array(
            array('978-2723442282'),
            array('978-2723442275'),
            array('978-2723455046'),
            array('978-2070546817'),
            array('978-2711858835'),
            array('978-2756406763'),
            array('978-2870971642'),
            array('978-2266238540'),
            array('978-2851806420'),
            array('978-0321812704'),
            array('978-0451225245'),
            array('978-0471292319'),
        );
    }

    public function getInvalidIsbn13()
    {
        return array(
            array('978-27234422821', Isbn::TOO_LONG_ERROR),
            array('978-272344228', Isbn::TOO_SHORT_ERROR),
            array('978-2723442-82', Isbn::TOO_SHORT_ERROR),
            array('978-2723442281', Isbn::CHECKSUM_FAILED_ERROR),
            array('978-0321513774', Isbn::CHECKSUM_FAILED_ERROR),
            array('979-0431225385', Isbn::CHECKSUM_FAILED_ERROR),
            array('980-0474292319', Isbn::CHECKSUM_FAILED_ERROR),
            array('0-4X19-92619812', Isbn::INVALID_CHARACTERS_ERROR),
            array('978_2723442282', Isbn::INVALID_CHARACTERS_ERROR),
            array('978#2723442282', Isbn::INVALID_CHARACTERS_ERROR),
            array('978-272C442282', Isbn::INVALID_CHARACTERS_ERROR),
            // chr(1) evaluates to 0
            // 978-2070546817 is valid
            array('978-2'.\chr(1).'70546817', Isbn::INVALID_CHARACTERS_ERROR),
        );
    }

    public function getValidIsbn()
    {
        return array_merge(
            $this->getValidIsbn10(),
            $this->getValidIsbn13()
        );
    }

    public function getInvalidIsbn()
    {
        return array_merge(
            $this->getInvalidIsbn10(),
            $this->getInvalidIsbn13()
        );
    }

    public function testNullIsValid()
    {
        $constraint = new Isbn(true);

        $this->validator->validate(null, $constraint);

        $this->assertNoViolation();
    }

    public function testEmptyStringIsValid()
    {
        $constraint = new Isbn(true);

        $this->validator->validate('', $constraint);

        $this->assertNoViolation();
    }

    /**
     * @expectedException \Symfony\Component\Validator\Exception\UnexpectedTypeException
     */
    public function testExpectsStringCompatibleType()
    {
        $constraint = new Isbn(true);

        $this->validator->validate(new \stdClass(), $constraint);
    }

    /**
     * @dataProvider getValidIsbn10
     */
    public function testValidIsbn10($isbn)
    {
        $constraint = new Isbn(array(
            'type' => 'isbn10',
        ));

        $this->validator->validate($isbn, $constraint);

        $this->assertNoViolation();
    }

    /**
     * @dataProvider getInvalidIsbn10
     */
    public function testInvalidIsbn10($isbn, $code)
    {
        $constraint = new Isbn(array(
            'type' => 'isbn10',
            'isbn10Message' => 'myMessage',
        ));

        $this->validator->validate($isbn, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$isbn.'"')
            ->setCode($code)
            ->assertRaised();
    }

    /**
     * @dataProvider getValidIsbn13
     */
    public function testValidIsbn13($isbn)
    {
        $constraint = new Isbn(array('type' => 'isbn13'));

        $this->validator->validate($isbn, $constraint);

        $this->assertNoViolation();
    }

    /**
     * @dataProvider getInvalidIsbn13
     */
    public function testInvalidIsbn13($isbn, $code)
    {
        $constraint = new Isbn(array(
            'type' => 'isbn13',
            'isbn13Message' => 'myMessage',
        ));

        $this->validator->validate($isbn, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$isbn.'"')
            ->setCode($code)
            ->assertRaised();
    }

    /**
     * @dataProvider getValidIsbn
     */
    public function testValidIsbnAny($isbn)
    {
        $constraint = new Isbn();

        $this->validator->validate($isbn, $constraint);

        $this->assertNoViolation();
    }

    /**
     * @dataProvider getInvalidIsbn10
     */
    public function testInvalidIsbnAnyIsbn10($isbn, $code)
    {
        $constraint = new Isbn(array(
            'bothIsbnMessage' => 'myMessage',
        ));

        $this->validator->validate($isbn, $constraint);

        // Too long for an ISBN-10, but not long enough for an ISBN-13
        if (Isbn::TOO_LONG_ERROR === $code) {
            $code = Isbn::TYPE_NOT_RECOGNIZED_ERROR;
        }

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$isbn.'"')
            ->setCode($code)
            ->assertRaised();
    }

    /**
     * @dataProvider getInvalidIsbn13
     */
    public function testInvalidIsbnAnyIsbn13($isbn, $code)
    {
        $constraint = new Isbn(array(
            'bothIsbnMessage' => 'myMessage',
        ));

        $this->validator->validate($isbn, $constraint);

        // Too short for an ISBN-13, but not short enough for an ISBN-10
        if (Isbn::TOO_SHORT_ERROR === $code) {
            $code = Isbn::TYPE_NOT_RECOGNIZED_ERROR;
        }

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$isbn.'"')
            ->setCode($code)
            ->assertRaised();
    }
}
