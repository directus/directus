<?php

/*
 * This file is part of the Prophecy.
 * (c) Konstantin Kudryashov <ever.zet@gmail.com>
 *     Marcello Duarte <marcello.duarte@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Prophecy;

use Prophecy\Argument\Token;

/**
 * Argument tokens shortcuts.
 *
 * @author Konstantin Kudryashov <ever.zet@gmail.com>
 */
class Argument
{
    /**
     * Checks that argument is exact value or object.
     *
     * @param mixed $value
     *
     * @return Token\ExactValueToken
     */
    public static function exact($value)
    {
        return new Token\ExactValueToken($value);
    }

    /**
     * Checks that argument is of specific type or instance of specific class.
     *
     * @param string $type Type name (`integer`, `string`) or full class name
     *
     * @return Token\TypeToken
     */
    public static function type($type)
    {
        return new Token\TypeToken($type);
    }

    /**
     * Checks that argument object has specific state.
     *
     * @param string $methodName
     * @param mixed  $value
     *
     * @return Token\ObjectStateToken
     */
    public static function which($methodName, $value)
    {
        return new Token\ObjectStateToken($methodName, $value);
    }

    /**
     * Checks that argument matches provided callback.
     *
     * @param callable $callback
     *
     * @return Token\CallbackToken
     */
    public static function that($callback)
    {
        return new Token\CallbackToken($callback);
    }

    /**
     * Matches any single value.
     *
     * @return Token\AnyValueToken
     */
    public static function any()
    {
        return new Token\AnyValueToken;
    }

    /**
     * Matches all values to the rest of the signature.
     *
     * @return Token\AnyValuesToken
     */
    public static function cetera()
    {
        return new Token\AnyValuesToken;
    }

    /**
     * Checks that argument matches all tokens
     *
     * @param mixed ... a list of tokens
     *
     * @return Token\LogicalAndToken
     */
    public static function allOf()
    {
        return new Token\LogicalAndToken(func_get_args());
    }

    /**
     * Checks that argument array or countable object has exact number of elements.
     *
     * @param integer $value array elements count
     *
     * @return Token\ArrayCountToken
     */
    public static function size($value)
    {
        return new Token\ArrayCountToken($value);
    }

    /**
     * Checks that argument array contains (key, value) pair
     *
     * @param mixed $key   exact value or token
     * @param mixed $value exact value or token
     *
     * @return Token\ArrayEntryToken
     */
    public static function withEntry($key, $value)
    {
        return new Token\ArrayEntryToken($key, $value);
    }

    /**
     * Checks that arguments array entries all match value
     *
     * @param mixed $value
     *
     * @return Token\ArrayEveryEntryToken
     */
    public static function withEveryEntry($value)
    {
        return new Token\ArrayEveryEntryToken($value);
    }

    /**
     * Checks that argument array contains value
     *
     * @param mixed $value
     *
     * @return Token\ArrayEntryToken
     */
    public static function containing($value)
    {
        return new Token\ArrayEntryToken(self::any(), $value);
    }

    /**
     * Checks that argument array has key
     *
     * @param mixed $key exact value or token
     *
     * @return Token\ArrayEntryToken
     */
    public static function withKey($key)
    {
        return new Token\ArrayEntryToken($key, self::any());
    }

    /**
     * Checks that argument does not match the value|token.
     *
     * @param mixed $value either exact value or argument token
     *
     * @return Token\LogicalNotToken
     */
    public static function not($value)
    {
        return new Token\LogicalNotToken($value);
    }

    /**
     * @param string $value
     *
     * @return Token\StringContainsToken
     */
    public static function containingString($value)
    {
        return new Token\StringContainsToken($value);
    }

    /**
     * Checks that argument is identical value.
     *
     * @param mixed $value
     *
     * @return Token\IdenticalValueToken
     */
    public static function is($value)
    {
        return new Token\IdenticalValueToken($value);
    }

    /**
     * Check that argument is same value when rounding to the
     * given precision.
     *
     * @param float $value
     * @param float $precision
     *
     * @return Token\ApproximateValueToken
     */
    public static function approximate($value, $precision = 0)
    {
        return new Token\ApproximateValueToken($value, $precision);
    }
}
