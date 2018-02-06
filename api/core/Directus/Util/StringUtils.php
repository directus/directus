<?php

namespace Directus\Util;

class StringUtils
{
    // Formats for string placeholder replacement
    // ex: {{variable}}
    const PLACEHOLDER_DOUBLE_MUSTACHE = '{{%s}}';
    // ex: %{variable}
    const PLACEHOLDER_PERCENTAGE_MUSTACHE = '%%{%s}';

    /**
     * Check whether or not a given string contains a given substring.
     *
     * @param  string $haystack
     * @param  string|array $needles
     * @return bool
     */
    public static function contains($haystack, $needles)
    {
        foreach ((array)$needles as $needle) {
            if ($needle != '' && mb_strpos($haystack, $needle) !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check whether or not a given string contains a given substring.
     *
     * Alias of StringUtils::contains
     *
     * @param string $haystack
     * @param string|array $needles
     *
     * @return bool
     */
    public static function has($haystack, $needles)
    {
        return static::contains($haystack, $needles);
    }

    // Source: http://stackoverflow.com/a/10473026/1772076
    /**
     * Return whether or not a string start with a specific string
     * @param  String $haystack
     * @param  String $needle
     * @return Boolean
     */
    public static function startsWith($haystack, $needle)
    {
        // search backwards starting from haystack length characters from the end
        return $needle === '' || strrpos($haystack, $needle, -strlen($haystack)) !== false;
    }

    /**
     * Return whether or not a string end with a specific string
     * @param  String $haystack
     * @param  String $needle
     * @return Boolean
     */
    public static function endsWith($haystack, $needle)
    {
        // search forward starting from end minus needle length characters
        return $needle === ''
            || (($temp = strlen($haystack) - strlen($needle)) >= 0&& strpos($haystack, $needle, $temp) !== false);
    }

    /**
     * Return the length of the given string.
     *
     * @param  string $value
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
     * @param  int $length
     * @return string
     */
    public static function random($length = 16)
    {
        $length = (int)$length;
        if ($length <= 0) {
            throw new \InvalidArgumentException(__t('random_length_must_be_greater_then_zero'));
        }

        if (function_exists('random_bytes')) {
            try {
                $random = random_bytes($length);
            } catch (\Exception $e) {
                $random = static::randomString($length);
            }
        } else if (function_exists('openssl_random_pseudo_bytes')) {
            $string = '';
            while (($len = strlen($string)) < $length) {
                $size = $length - $len;
                $bytes = openssl_random_pseudo_bytes($size);
                $string .= substr(str_replace(['/', '+', '='], '', base64_encode($bytes)), 0, $size);
            }

            $random = $string;
        } else {
            $random = static::randomString($length);
        }

        return $random;
    }

    /**
     * Random string shuffled from a list of alphanumeric characters
     *
     * @param int $length
     * @param string $type
     *
     * @return string
     */
    public static function randomString($length = 16, $type = 'alphanumeric')
    {
        $numeric = '0123456789';
        $loweralpha = 'abcdefghijklmnopqrstuvwxyz';
        $upperalpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $pool = '';

        switch ($type) {
            case 'numeric': $pool = $numeric; break;
            case 'loweralpha': $pool = $loweralpha; break;
            case 'upperalpha': $pool = $upperalpha; break;
            case 'loweralphanumeric': $pool = $numeric . $loweralpha; break;
            case 'upperalphanumeric': $pool = $numeric . $upperalpha; break;
            default: $pool = $numeric . $loweralpha . $upperalpha;
        }

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
        $newParts = array_map(function ($string) {
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

    /**
     * Returns the next sequence for a string
     *
     * @param string $chars
     * @return string
     */
    public static function charSequence($chars = '')
    {
        if (!$chars) {
            return 'a';
        }

        return ++$chars;
    }

    /**
     * Replace a string placeholder with the given data.
     *
     * @param $string
     * @param array $data
     * @param string $placeHolderFormat
     *
     * @return string
     */
    public static function replacePlaceholder($string, $data = [], $placeHolderFormat = self::PLACEHOLDER_DOUBLE_MUSTACHE)
    {
        foreach ($data as $key => $value) {
            if (is_bool($value)) {
                $value = $value ? 'true' : 'false';
            }

            if (is_scalar($value)) {
                $string = str_replace(sprintf($placeHolderFormat, $key), $value, $string);
            }
        }

        return $string;
    }

    /**
     * Split an csv string into array
     *
     * @param string $csv
     * @param bool $trim
     *
     * @return array
     */
    public static function csv($csv, $trim = true)
    {
        if (!is_string($csv)) {
            throw new \InvalidArgumentException('$cvs must be a string');
        }

        $array = explode(',', $csv);

        if ($trim) {
            $array = array_map('trim', $array);
        }

        return $array;
    }
}
