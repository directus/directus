<?php

namespace Directus\Util;

class StringUtils
{
    // Source: http://stackoverflow.com/a/10473026/1772076
    /**
     * Return whether or not a string start with a specific string
     * @param  String  $haystack
     * @param  String  $needle
     * @return Boolean
     */
    public static function startsWith($haystack, $needle)
    {
        // search backwards starting from haystack length characters from the end
        return $needle === "" || strrpos($haystack, $needle, -strlen($haystack)) !== FALSE;
    }

    /**
     * Return whether or not a string end with a specific string
     * @param  String  $haystack
     * @param  String  $needle
     * @return Boolean
     */
    public static function endsWith($haystack, $needle)
    {
        // search forward starting from end minus needle length characters
        return $needle === "" || (($temp = strlen($haystack) - strlen($needle)) >= 0 && strpos($haystack, $needle, $temp) !== FALSE);
    }

    /**
     * Return the length of the given string.
     *
     * @param  string  $value
     * @return int
     */
    public static function length($value)
    {
        return mb_strlen($value);
    }

    /**
     * Generate a "random" alpha-numeric string.
     *
     * From Laravel
     * @param  int  $length
     * @return string
     */
    public static function random($length = 16)
    {
        $length = (int)$length;
        if ($length <= 0) {
            throw new \InvalidArgumentException('Random Length must be greater than 0.');
        }

        if (function_exists('openssl_random_pseudo_bytes')) {
            $string = '';
            while (($len = strlen($string)) < $length) {
                $size = $length - $len;
                $bytes = openssl_random_pseudo_bytes($size);
                $string .= substr(str_replace(['/', '+', '='], '', base64_encode($bytes)), 0, $size);
            }

            return $string;
        }

        $pool = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return substr(str_shuffle(str_repeat($pool, $length)), 0, $length);
    }

    /**
     * Convert a string separated by $separator to camel case.
     *
     * @param $string
     * @param bool $first
     * @param string $separator
     *
     * @return string
     */
    public static function toCamelCase($string, $first = false, $separator = '_')
    {
        $parts = explode($separator, $string);
        $newParts = array_map(function($string) {
            return ucwords($string);
        }, $parts);

        $newString = implode('', $newParts);

        if ($first === false) {
            $newString[0] = strtolower($newString[0]);
        }

        return $newString;
    }

    /**
     *  Convert a string separated by underscore to camel case.
     *
     * @param $string
     * @param bool $first
     *
     * @return string
     */
    public static function underscoreToCamelCase($string, $first = false)
    {
        return static::toCamelCase($string, $first);
    }

    public static function charSequence($chars = '')
    {
        $letters = range('a', 'z');
        $arr = str_split($chars);

        // Replace each character with numeric equivalent
        foreach ($arr as $key => $char) {
            $arr[$key] = array_search($char, $letters);
        }

        $digits = count($arr)-1; // Count digits
        for ($i=$digits; $i > -1; $i--) { // Starting at the right-most spot, move left
            if ($i == $digits) { // If this is the right most spot
                $arr[$i]++; // Increment it
            }

            if ($arr[$i] == 26) { // If this spot has moved past "z"
                $arr[$i] = 0;	// Set it to "a"
                if ($i != 0) { // Unless it is the left most spot
                    $arr[$i - 1]++;  // Carry the one to the next spot
                }
            }
        }

        // Rebuild characters from numeric equivalent
        foreach ($arr as $key => $char) {
            $arr[$key] = $letters[$char];
        }

        $charsSequence = implode($arr);

        return $charsSequence;
    }
}
