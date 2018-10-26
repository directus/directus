<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Framework_Constraint_IsJsonTest extends PHPUnit_Framework_TestCase
{
    /**
     * @dataProvider evaluateDataprovider
     */
    public function testEvaluate($expected, $jsonOther)
    {
        $constraint = new PHPUnit_Framework_Constraint_IsJson();
        $this->assertEquals($expected, $constraint->evaluate($jsonOther, '', true));
    }

    public static function evaluateDataprovider()
    {
        return [
            'valid JSON'                                     => [true, '{}'],
            'empty string should be treated as invalid JSON' => [false, ''],
        ];
    }
}
