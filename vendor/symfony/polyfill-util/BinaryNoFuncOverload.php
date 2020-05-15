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
 * @author Nicolas Grekas <p@tchwork.com>
 *
 * @internal
 */
class BinaryNoFuncOverload
{
    public static function strlen($s)
    {
        return \strlen($s);
    }

    public static function strpos($haystack, $needle, $offset = 0)
    {
        return strpos($haystack, $needle, $offset);
    }

    public static function strrpos($haystack, $needle, $offset = 0)
    {
        return strrpos($haystack, $needle, $offset);
    }

    public static function substr($string, $start, $length = PHP_INT_MAX)
    {
        return substr($string, $start, $length);
    }

    public static function stripos($s, $needle, $offset = 0)
    {
        return stripos($s, $needle, $offset);
    }

    public static function stristr($s, $needle, $part = false)
    {
        return stristr($s, $needle, $part);
    }

    public static function strrchr($s, $needle, $part = false)
    {
        return strrchr($s, $needle, $part);
    }

    public static function strripos($s, $needle, $offset = 0)
    {
        return strripos($s, $needle, $offset);
    }

    public static function strstr($s, $needle, $part = false)
    {
        return strstr($s, $needle, $part);
    }
}
