<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Tests;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;

final class ConstraintValidatorTest extends TestCase
{
    /**
     * @dataProvider formatValueProvider
     */
    public function testFormatValue($expected, $value, $format = 0)
    {
        $this->assertSame($expected, (new TestFormatValueConstraintValidator())->formatValueProxy($value, $format));
    }

    public function formatValueProvider()
    {
        $data = [
            ['true', true],
            ['false', false],
            ['null', null],
            ['resource', fopen('php://memory', 'r')],
            ['"foo"', 'foo'],
            ['array', []],
            ['object', $toString = new TestToStringObject()],
            ['ccc', $toString, ConstraintValidator::OBJECT_TO_STRING],
            ['object', $dateTime = (new \DateTimeImmutable('@0'))->setTimezone(new \DateTimeZone('UTC'))],
            [class_exists(\IntlDateFormatter::class) ? 'Jan 1, 1970, 12:00 AM' : '1970-01-01 00:00:00', $dateTime, ConstraintValidator::PRETTY_DATE],
        ];

        return $data;
    }
}

final class TestFormatValueConstraintValidator extends ConstraintValidator
{
    public function validate($value, Constraint $constraint)
    {
    }

    public function formatValueProxy($value, $format)
    {
        return $this->formatValue($value, $format);
    }
}

final class TestToStringObject
{
    public function __toString()
    {
        return 'ccc';
    }
}
