<?php

namespace Directus\Util;

class StringUtils
{
    // Formats for string placeholder replacement
    // ex: {{variable}}
    const PLACEHOLDER_DOUBLE_MUSTACHE = '{{%s}}';
    // ex: %{variable}
    const PLACEHOLDER_PERCENTAGE_MUSTACHE = '%%{%s}';

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
     * Replace a string placeholder with the given data.
     * @param $string
     * @param array $data
     * @param string $placeHolderFormat
     * @return string
     */
    public static function replacePlaceholder($string, $data = [], $placeHolderFormat = self::PLACEHOLDER_DOUBLE_MUSTACHE)
    {
        foreach ($data as $key => $value) {
            $string = str_replace(sprintf($placeHolderFormat, $key), $value, $string);
        }

        return $string;
    }
}
