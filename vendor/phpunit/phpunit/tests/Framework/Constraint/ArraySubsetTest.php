<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class PHPUnit_Framework_Constraint_ArraySubsetTest extends PHPUnit_Framework_TestCase
{
    /**
     * @param bool              $expected
     * @param array|Traversable $subset
     * @param array|Traversable $other
     * @param bool              $strict
     * @dataProvider evaluateDataProvider
     */
    public function testEvaluate($expected, $subset, $other, $strict)
    {
        $constraint = new PHPUnit_Framework_Constraint_ArraySubset($subset, $strict);

        $this->assertSame($expected, $constraint->evaluate($other, '', true));
    }

    public static function evaluateDataProvider()
    {
        return [
            'loose array subset and array other' => [
                'expected' => true,
                'subset'   => ['bar' => 0],
                'other'    => ['foo' => '', 'bar' => '0'],
                'strict'   => false
            ],
            'strict array subset and array other' => [
                'expected' => false,
                'subset'   => ['bar' => 0],
                'other'    => ['foo' => '', 'bar' => '0'],
                'strict'   => true
            ],
            'loose array subset and ArrayObject other' => [
                'expected' => true,
                'subset'   => ['bar' => 0],
                'other'    => new ArrayObject(['foo' => '', 'bar' => '0']),
                'strict'   => false
            ],
            'strict ArrayObject subset and array other' => [
                'expected' => true,
                'subset'   => new ArrayObject(['bar' => 0]),
                'other'    => ['foo' => '', 'bar' => 0],
                'strict'   => true
            ],
        ];
    }

    public function testEvaluateWithArrayAccess()
    {
        $arrayAccess = new ArrayAccessible(['foo' => 'bar']);

        $constraint = new PHPUnit_Framework_Constraint_ArraySubset(['foo' => 'bar']);

        $this->assertTrue($constraint->evaluate($arrayAccess, '', true));
    }
}
