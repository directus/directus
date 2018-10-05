<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Framework_Constraint_JsonMatches_ErrorMessageProviderTest extends PHPUnit_Framework_TestCase
{
    /**
     * @dataProvider translateTypeToPrefixDataprovider
     */
    public function testTranslateTypeToPrefix($expected, $type)
    {
        $this->assertEquals(
            $expected,
            PHPUnit_Framework_Constraint_JsonMatches_ErrorMessageProvider::translateTypeToPrefix($type)
        );
    }

    /**
     * @dataProvider determineJsonErrorDataprovider
     */
    public function testDetermineJsonError($expected, $error, $prefix)
    {
        $this->assertEquals(
            $expected,
            PHPUnit_Framework_Constraint_JsonMatches_ErrorMessageProvider::determineJsonError(
                $error,
                $prefix
            )
        );
    }

    public static function determineJsonErrorDataprovider()
    {
        return [
            'JSON_ERROR_NONE'  => [
                null, 'json_error_none', ''
            ],
            'JSON_ERROR_DEPTH' => [
                'Maximum stack depth exceeded', JSON_ERROR_DEPTH, ''
            ],
            'prefixed JSON_ERROR_DEPTH' => [
                'TUX: Maximum stack depth exceeded', JSON_ERROR_DEPTH, 'TUX: '
            ],
            'JSON_ERROR_STATE_MISMatch' => [
                'Underflow or the modes mismatch', JSON_ERROR_STATE_MISMATCH, ''
            ],
            'JSON_ERROR_CTRL_CHAR' => [
                'Unexpected control character found', JSON_ERROR_CTRL_CHAR, ''
            ],
            'JSON_ERROR_SYNTAX' => [
                'Syntax error, malformed JSON', JSON_ERROR_SYNTAX, ''
            ],
            'JSON_ERROR_UTF8`' => [
                'Malformed UTF-8 characters, possibly incorrectly encoded',
                JSON_ERROR_UTF8,
                ''
            ],
            'Invalid error indicator' => [
                'Unknown error', 55, ''
            ],
        ];
    }

    public static function translateTypeToPrefixDataprovider()
    {
        return [
            'expected' => ['Expected value JSON decode error - ', 'expected'],
            'actual'   => ['Actual value JSON decode error - ', 'actual'],
            'default'  => ['', ''],
        ];
    }
}
