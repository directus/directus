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

use Symfony\Component\Validator\Constraints\Issn;
use Symfony\Component\Validator\Constraints\IssnValidator;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

/**
 * @see https://en.wikipedia.org/wiki/Issn
 */
class IssnValidatorTest extends ConstraintValidatorTestCase
{
    protected function createValidator()
    {
        return new IssnValidator();
    }

    public function getValidLowerCasedIssn()
    {
        return array(
            array('2162-321x'),
            array('2160-200x'),
            array('1537-453x'),
            array('1937-710x'),
            array('0002-922x'),
            array('1553-345x'),
            array('1553-619x'),
        );
    }

    public function getValidNonHyphenatedIssn()
    {
        return array(
            array('2162321X'),
            array('01896016'),
            array('15744647'),
            array('14350645'),
            array('07174055'),
            array('20905076'),
            array('14401592'),
        );
    }

    public function getFullValidIssn()
    {
        return array(
            array('1550-7416'),
            array('1539-8560'),
            array('2156-5376'),
            array('1119-023X'),
            array('1684-5315'),
            array('1996-0786'),
            array('1684-5374'),
            array('1996-0794'),
        );
    }

    public function getValidIssn()
    {
        return array_merge(
            $this->getValidLowerCasedIssn(),
            $this->getValidNonHyphenatedIssn(),
            $this->getFullValidIssn()
        );
    }

    public function getInvalidIssn()
    {
        return array(
            array(0, Issn::TOO_SHORT_ERROR),
            array('1539', Issn::TOO_SHORT_ERROR),
            array('2156-537A', Issn::INVALID_CHARACTERS_ERROR),
            array('1119-0231', Issn::CHECKSUM_FAILED_ERROR),
            array('1684-5312', Issn::CHECKSUM_FAILED_ERROR),
            array('1996-0783', Issn::CHECKSUM_FAILED_ERROR),
            array('1684-537X', Issn::CHECKSUM_FAILED_ERROR),
            array('1996-0795', Issn::CHECKSUM_FAILED_ERROR),
        );
    }

    public function testNullIsValid()
    {
        $constraint = new Issn();

        $this->validator->validate(null, $constraint);

        $this->assertNoViolation();
    }

    public function testEmptyStringIsValid()
    {
        $constraint = new Issn();

        $this->validator->validate('', $constraint);

        $this->assertNoViolation();
    }

    /**
     * @expectedException \Symfony\Component\Validator\Exception\UnexpectedTypeException
     */
    public function testExpectsStringCompatibleType()
    {
        $constraint = new Issn();
        $this->validator->validate(new \stdClass(), $constraint);
    }

    /**
     * @dataProvider getValidLowerCasedIssn
     */
    public function testCaseSensitiveIssns($issn)
    {
        $constraint = new Issn(array(
            'caseSensitive' => true,
            'message' => 'myMessage',
        ));

        $this->validator->validate($issn, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$issn.'"')
            ->setCode(Issn::INVALID_CASE_ERROR)
            ->assertRaised();
    }

    /**
     * @dataProvider getValidNonHyphenatedIssn
     */
    public function testRequireHyphenIssns($issn)
    {
        $constraint = new Issn(array(
            'requireHyphen' => true,
            'message' => 'myMessage',
        ));

        $this->validator->validate($issn, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$issn.'"')
            ->setCode(Issn::MISSING_HYPHEN_ERROR)
            ->assertRaised();
    }

    /**
     * @dataProvider getValidIssn
     */
    public function testValidIssn($issn)
    {
        $constraint = new Issn();

        $this->validator->validate($issn, $constraint);

        $this->assertNoViolation();
    }

    /**
     * @dataProvider getInvalidIssn
     */
    public function testInvalidIssn($issn, $code)
    {
        $constraint = new Issn(array(
            'message' => 'myMessage',
        ));

        $this->validator->validate($issn, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$issn.'"')
            ->setCode($code)
            ->assertRaised();
    }
}
