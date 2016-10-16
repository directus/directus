<?php

namespace Directus\Util;

class ArrayUtils
{
    /**
     * Get an item from an array
     *
     * @param  array $array
     * @param  string $key
     * @param  mixed $default
     *
     * @return mixed
     */
    public static function get($array, $key, $default = null)
    {
        if (static::exists($array, $key)) {
            return $array[$key];
        }

        if (strpos($key, '.') !== FALSE) {
            $array = static::dot($array);
            if (static::exists($array, $key)) {
                return $array[$key];
            }
        }

        return $default;
    }

    public static function has($array, $key)
    {
        if (static::exists($array, $key)) {
            return true;
        }

        if (strpos($key, '.') === FALSE) {
            return false;
        }

        $array = static::dot($array);

        return static::exists($array, $key);
    }

    public static function exists($array, $key)
    {
        return array_key_exists($key, $array);
    }

    /**
     * Filter an array by keys
     * @param $array
     * @param $keys
     * @param bool $omit
     * @return array
     */
    public static function filterByKey($array, $keys, $omit = false)
    {
        $result = [];

        if (is_string($keys)) {
            $keys = [$keys];
        }

        foreach ($array as $key => $value) {
            $condition = in_array($key, $keys);
            if ($omit) {
                $condition = !$condition;
            }

            if ($condition) {
                $result[$key] = $value;
            }
        }

        return $result;
    }

    /**
     * Return a copy of the object, filtered to only have values for the whitelisted keys (or array of valid keys).
     * @param  array $array
     * @param  string|array $keys
     * @return array
     */
    public static function pick($array, $keys)
    {
        return static::filterByKey($array, $keys);
    }

    /**
     * Return a copy of the object, filtered to omit values for the blacklisted keys (or array of valid keys).
     * @param  array $array
     * @param  string|array $keys
     * @return array
     */
    public static function omit($array, $keys)
    {
        return static::filterByKey($array, $keys, true);
    }

    /**
     * Return whether or not a set of keys exists in an array
     *
     * @param  array $array
     * @param  array|mixed $keys
     *
     * @return bool
     */
    public static function contains($array, $keys)
    {
        if (!is_array($keys)) {
            $keys = [$keys];
        }

        foreach ($keys as $key) {
            if (!array_key_exists($key, $array)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Flatten a multi-dimensional associative array with a dots.
     *
     * @param  array $array
     * @param  string $prepend
     * @return array
     */
    public static function dot($array, $prepend = '')
    {
        return static::flatKey('.', $array, $prepend);
    }

    /**
     * Flatten a multi-dimensional associative array with a character.
     *
     * @param  string $separator
     * @param  array $array
     * @param  string $prepend
     * @return array
     */
    public static function flatKey($separator, $array, $prepend = '')
    {
        $results = [];

        foreach ($array as $key => $value) {
            if (is_array($value)) {
                if (empty($value)) {
                    $results[$prepend . $key] = '';
                } else {
                    $results = array_merge($results, static::flatKey($separator, $value, $prepend . $key . $separator));
                }
            } else {
                $results[$prepend . $key] = $value;
            }
        }

        return $results;
    }

    /**
     * Get the missing values from a array in another array
     *
     * @param array $from
     * @param array $target
     *
     * @return array
     */
    public static function missing(array $from, array $target)
    {
        $missing = [];

        foreach($target as $value) {
            if (!in_array($value, $from)) {
                $missing[] = $value;
            }
        }

        return $missing;
    }

    /**
     * Checks whether the given array has only numeric keys
     * 
     * @param $array
     *
     * @return bool
     */
    public static function isNumericKeys($array)
    {
        foreach (array_keys($array) as $key) {
            if (!is_numeric($key)) {
                return false;
            }
        }

        return true;
    }
}
