<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Polyfill\Util;

/**
 * Binary safe version of string functions overloaded when MB_OVERLOAD_STRING is enabled.
 *
 * @author Nicolas Grekas <p@tchwork.com>
 *
 * @internal
 */
class BinaryOnFuncOverload
{
    public static function strlen($s)
    {
        return mb_strlen($s, '8bit');
    }

    public static function strpos($haystack, $needle, $offset = 0)
    {
        return mb_strpos($haystack, $needle, $offset, '8bit');
    }

    public static function strrpos($haystack, $needle, $offset = 0)
    {
        return mb_strrpos($haystack, $needle, $offset, '8bit');
    }

    public static function substr($string, $start, $length = 2147483647)
    {
        return mb_substr($string, $start, $length, '8bit');
    }

    public static function stripos($s, $needle, $offset = 0)
    {
        return mb_stripos($s, $needle, $offset, '8bit');
    }

    public static function stristr($s, $needle, $part = false)
    {
        return mb_stristr($s, $needle, $part, '8bit');
    }

    public static function strrchr($s, $needle, $part = false)
    {
        return mb_strrchr($s, $needle, $part, '8bit');
    }

    public static function strripos($s, $needle, $offset = 0)
    {
        return mb_strripos($s, $needle, $offset, '8bit');
    }

    public static function strstr($s, $needle, $part = false)
    {
        return mb_strstr($s, $needle, $part, '8bit');
    }
}
