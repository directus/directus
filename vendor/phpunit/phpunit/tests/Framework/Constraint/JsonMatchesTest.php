<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Framework_Constraint_JsonMatchesTest extends PHPUnit_Framework_TestCase
{
    /**
     * @dataProvider evaluateDataprovider
     */
    public function testEvaluate($expected, $jsonOther, $jsonValue)
    {
        $constraint = new PHPUnit_Framework_Constraint_JsonMatches($jsonValue);
        $this->assertEquals($expected, $constraint->evaluate($jsonOther, '', true));
    }

    public function testToString()
    {
        $jsonValue  = json_encode(['Mascott' => 'Tux']);
        $constraint = new PHPUnit_Framework_Constraint_JsonMatches($jsonValue);

        $this->assertEquals('matches JSON string "' . $jsonValue . '"', $constraint->toString());
    }

    public static function evaluateDataprovider()
    {
        return [
            'valid JSON'                          => [true, json_encode(['Mascott'                           => 'Tux']), json_encode(['Mascott'                           => 'Tux'])],
            'error syntax'                        => [false, '{"Mascott"::}', json_encode(['Mascott'         => 'Tux'])],
            'error UTF-8'                         => [false, json_encode('\xB1\x31'), json_encode(['Mascott' => 'Tux'])],
            'invalid JSON in class instantiation' => [false, json_encode(['Mascott'                          => 'Tux']), '{"Mascott"::}'],
        ];
    }
}
