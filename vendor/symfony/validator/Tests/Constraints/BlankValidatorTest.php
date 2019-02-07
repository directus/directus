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

use Symfony\Component\Validator\Constraints\Blank;
use Symfony\Component\Validator\Constraints\BlankValidator;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

class BlankValidatorTest extends ConstraintValidatorTestCase
{
    protected function createValidator()
    {
        return new BlankValidator();
    }

    public function testNullIsValid()
    {
        $this->validator->validate(null, new Blank());

        $this->assertNoViolation();
    }

    public function testBlankIsValid()
    {
        $this->validator->validate('', new Blank());

        $this->assertNoViolation();
    }

    /**
     * @dataProvider getInvalidValues
     */
    public function testInvalidValues($value, $valueAsString)
    {
        $constraint = new Blank([
            'message' => 'myMessage',
        ]);

        $this->validator->validate($value, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', $valueAsString)
            ->setCode(Blank::NOT_BLANK_ERROR)
            ->assertRaised();
    }

    public function getInvalidValues()
    {
        return [
            ['foobar', '"foobar"'],
            [0, '0'],
            [false, 'false'],
            [1234, '1234'],
        ];
    }
}
