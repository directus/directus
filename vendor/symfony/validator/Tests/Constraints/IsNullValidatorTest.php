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

use Symfony\Component\Validator\Constraints\IsNull;
use Symfony\Component\Validator\Constraints\IsNullValidator;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

class IsNullValidatorTest extends ConstraintValidatorTestCase
{
    protected function createValidator()
    {
        return new IsNullValidator();
    }

    public function testNullIsValid()
    {
        $this->validator->validate(null, new IsNull());

        $this->assertNoViolation();
    }

    /**
     * @dataProvider getInvalidValues
     */
    public function testInvalidValues($value, $valueAsString)
    {
        $constraint = new IsNull([
            'message' => 'myMessage',
        ]);

        $this->validator->validate($value, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', $valueAsString)
            ->setCode(IsNull::NOT_NULL_ERROR)
            ->assertRaised();
    }

    public function getInvalidValues()
    {
        return [
            [0, '0'],
            [false, 'false'],
            [true, 'true'],
            ['', '""'],
            ['foo bar', '"foo bar"'],
            [new \DateTime(), 'object'],
            [new \stdClass(), 'object'],
            [[], 'array'],
        ];
    }
}
