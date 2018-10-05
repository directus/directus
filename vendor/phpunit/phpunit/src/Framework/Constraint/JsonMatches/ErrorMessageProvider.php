<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Provides human readable messages for each JSON error.
 */
class PHPUnit_Framework_Constraint_JsonMatches_ErrorMessageProvider
{
    /**
     * Translates JSON error to a human readable string.
     *
     * @param string $error
     * @param string $prefix
     *
     * @return string
     */
    public static function determineJsonError($error, $prefix = '')
    {
        switch ($error) {
            case JSON_ERROR_NONE:
                return;
            case JSON_ERROR_DEPTH:
                return $prefix . 'Maximum stack depth exceeded';
            case JSON_ERROR_STATE_MISMATCH:
                return $prefix . 'Underflow or the modes mismatch';
            case JSON_ERROR_CTRL_CHAR:
                return $prefix . 'Unexpected control character found';
            case JSON_ERROR_SYNTAX:
                return $prefix . 'Syntax error, malformed JSON';
            case JSON_ERROR_UTF8:
                return $prefix . 'Malformed UTF-8 characters, possibly incorrectly encoded';
            default:
                return $prefix . 'Unknown error';
        }
    }

    /**
     * Translates a given type to a human readable message prefix.
     *
     * @param string $type
     *
     * @return string
     */
    public static function translateTypeToPrefix($type)
    {
        switch (strtolower($type)) {
            case 'expected':
                $prefix = 'Expected value JSON decode error - ';
                break;
            case 'actual':
                $prefix = 'Actual value JSON decode error - ';
                break;
            default:
                $prefix = '';
                break;
        }

        return $prefix;
    }
}
