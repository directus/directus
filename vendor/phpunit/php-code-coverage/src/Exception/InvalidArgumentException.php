<?php
/*
 * This file is part of the php-code-coverage package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\CodeCoverage;

class InvalidArgumentException extends \InvalidArgumentException implements Exception
{
    /**
     * @param int    $argument
     * @param string $type
     * @param mixed  $value
     *
     * @return InvalidArgumentException
     */
    public static function create($argument, $type, $value = null)
    {
        $stack = debug_backtrace(0);

        return new self(
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
