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

use Symfony\Component\Validator\Constraints\Bic;
use Symfony\Component\Validator\Constraints\BicValidator;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

class BicValidatorTest extends ConstraintValidatorTestCase
{
    protected function createValidator()
    {
        return new BicValidator();
    }

    public function testNullIsValid()
    {
        $this->validator->validate(null, new Bic());

        $this->assertNoViolation();
    }

    public function testEmptyStringIsValid()
    {
        $this->validator->validate('', new Bic());

        $this->assertNoViolation();
    }

    /**
     * @dataProvider getValidBics
     */
    public function testValidBics($bic)
    {
        $this->validator->validate($bic, new Bic());

        $this->assertNoViolation();
    }

    public function getValidBics()
    {
        // http://formvalidation.io/validators/bic/
        return array(
            array('ASPKAT2LXXX'),
            array('ASPKAT2L'),
            array('DSBACNBXSHA'),
            array('UNCRIT2B912'),
            array('DABADKKK'),
            array('RZOOAT2L303'),
        );
    }

    /**
     * @dataProvider getInvalidBics
     */
    public function testInvalidBics($bic, $code)
    {
        $constraint = new Bic(array(
            'message' => 'myMessage',
        ));

        $this->validator->validate($bic, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '"'.$bic.'"')
            ->setCode($code)
            ->assertRaised();
    }

    public function getInvalidBics()
    {
        return array(
            array('DEUTD', Bic::INVALID_LENGTH_ERROR),
            array('ASPKAT2LXX', Bic::INVALID_LENGTH_ERROR),
            array('ASPKAT2LX', Bic::INVALID_LENGTH_ERROR),
            array('ASPKAT2LXXX1', Bic::INVALID_LENGTH_ERROR),
            array('DABADKK', Bic::INVALID_LENGTH_ERROR),
            array('1SBACNBXSHA', Bic::INVALID_BANK_CODE_ERROR),
            array('RZ00AT2L303', Bic::INVALID_BANK_CODE_ERROR),
            array('D2BACNBXSHA', Bic::INVALID_BANK_CODE_ERROR),
            array('DS3ACNBXSHA', Bic::INVALID_BANK_CODE_ERROR),
            array('DSB4CNBXSHA', Bic::INVALID_BANK_CODE_ERROR),
            array('DEUT12HH', Bic::INVALID_COUNTRY_CODE_ERROR),
            array('DSBAC6BXSHA', Bic::INVALID_COUNTRY_CODE_ERROR),
            array('DSBA5NBXSHA', Bic::INVALID_COUNTRY_CODE_ERROR),

            // branch code error
            array('THISSVAL1D]', Bic::INVALID_CHARACTERS_ERROR),

            // location code error
            array('DEUTDEF]', Bic::INVALID_CHARACTERS_ERROR),

            // lower case values are invalid
            array('DeutAT2LXXX', Bic::INVALID_CASE_ERROR),
            array('DEUTAT2lxxx', Bic::INVALID_CASE_ERROR),
        );
    }
}
