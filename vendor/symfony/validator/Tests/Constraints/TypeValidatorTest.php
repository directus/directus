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

use Symfony\Component\Validator\Constraints\Type;
use Symfony\Component\Validator\Constraints\TypeValidator;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

class TypeValidatorTest extends ConstraintValidatorTestCase
{
    protected static $file;

    protected function createValidator()
    {
        return new TypeValidator();
    }

    public function testNullIsValid()
    {
        $constraint = new Type(['type' => 'integer']);

        $this->validator->validate(null, $constraint);

        $this->assertNoViolation();
    }

    public function testEmptyIsValidIfString()
    {
        $constraint = new Type(['type' => 'string']);

        $this->validator->validate('', $constraint);

        $this->assertNoViolation();
    }

    public function testEmptyIsInvalidIfNoString()
    {
        $constraint = new Type([
            'type' => 'integer',
            'message' => 'myMessage',
        ]);

        $this->validator->validate('', $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', '""')
            ->setParameter('{{ type }}', 'integer')
            ->setCode(Type::INVALID_TYPE_ERROR)
            ->assertRaised();
    }

    /**
     * @dataProvider getValidValues
     */
    public function testValidValues($value, $type)
    {
        $constraint = new Type(['type' => $type]);

        $this->validator->validate($value, $constraint);

        $this->assertNoViolation();
    }

    public function getValidValues()
    {
        $object = new \stdClass();
        $file = $this->createFile();

        return [
            [true, 'Boolean'],
            [false, 'Boolean'],
            [true, 'boolean'],
            [false, 'boolean'],
            [true, 'bool'],
            [false, 'bool'],
            [0, 'numeric'],
            ['0', 'numeric'],
            [1.5, 'numeric'],
            ['1.5', 'numeric'],
            [0, 'integer'],
            [1.5, 'float'],
            ['12345', 'string'],
            [[], 'array'],
            [$object, 'object'],
            [$object, 'stdClass'],
            [$file, 'resource'],
            ['12345', 'digit'],
            ['12a34', 'alnum'],
            ['abcde', 'alpha'],
            ["\n\r\t", 'cntrl'],
            ['arf12', 'graph'],
            ['abcde', 'lower'],
            ['ABCDE', 'upper'],
            ['arf12', 'print'],
            ['*&$()', 'punct'],
            ["\n\r\t", 'space'],
            ['AB10BC99', 'xdigit'],
        ];
    }

    /**
     * @dataProvider getInvalidValues
     */
    public function testInvalidValues($value, $type, $valueAsString)
    {
        $constraint = new Type([
            'type' => $type,
            'message' => 'myMessage',
        ]);

        $this->validator->validate($value, $constraint);

        $this->buildViolation('myMessage')
            ->setParameter('{{ value }}', $valueAsString)
            ->setParameter('{{ type }}', $type)
            ->setCode(Type::INVALID_TYPE_ERROR)
            ->assertRaised();
    }

    public function getInvalidValues()
    {
        $object = new \stdClass();
        $file = $this->createFile();

        return [
            ['foobar', 'numeric', '"foobar"'],
            ['foobar', 'boolean', '"foobar"'],
            ['0', 'integer', '"0"'],
            ['1.5', 'float', '"1.5"'],
            [12345, 'string', '12345'],
            [$object, 'boolean', 'object'],
            [$object, 'numeric', 'object'],
            [$object, 'integer', 'object'],
            [$object, 'float', 'object'],
            [$object, 'string', 'object'],
            [$object, 'resource', 'object'],
            [$file, 'boolean', 'resource'],
            [$file, 'numeric', 'resource'],
            [$file, 'integer', 'resource'],
            [$file, 'float', 'resource'],
            [$file, 'string', 'resource'],
            [$file, 'object', 'resource'],
            ['12a34', 'digit', '"12a34"'],
            ['1a#23', 'alnum', '"1a#23"'],
            ['abcd1', 'alpha', '"abcd1"'],
            ["\nabc", 'cntrl', "\"\nabc\""],
            ["abc\n", 'graph', "\"abc\n\""],
            ['abCDE', 'lower', '"abCDE"'],
            ['ABcde', 'upper', '"ABcde"'],
            ["\nabc", 'print', "\"\nabc\""],
            ['abc&$!', 'punct', '"abc&$!"'],
            ["\nabc", 'space', "\"\nabc\""],
            ['AR1012', 'xdigit', '"AR1012"'],
        ];
    }

    protected function createFile()
    {
        if (!static::$file) {
            static::$file = fopen(__FILE__, 'r');
        }

        return static::$file;
    }

    public static function tearDownAfterClass()
    {
        if (static::$file) {
            fclose(static::$file);
            static::$file = null;
        }
    }
}
