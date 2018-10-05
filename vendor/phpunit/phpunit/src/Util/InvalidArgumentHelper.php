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
 * Factory for PHPUnit_Framework_Exception objects that are used to describe
 * invalid arguments passed to a function or method.
 */
class PHPUnit_Util_InvalidArgumentHelper
{
    /**
     * @param int    $argument
     * @param string $type
     * @param mixed  $value
     *
     * @return PHPUnit_Framework_Exception
     */
    public static function factory($argument, $type, $value = null)
    {
        $stack = debug_backtrace(false);

        return new PHPUnit_Framework_Exception(
            sprintf(
                'Argument #%d%sof %s::%s() must be a %s',
                $argument,
                $value !== null ? ' (' . gettype($value) . '#' . $value . ')' : ' (No Value) ',
                $stack[1]['class'],
                $stack[1]['function'],
                $type
            )
        );
    }
}
