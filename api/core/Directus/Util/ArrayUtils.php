<?php

namespace Directus\Util;

class ArrayUtils
{
    /**
     * Get an item from an array
     *
     * @param  array   $array
     * @param  string  $key
     * @param  mixed   $default
     *
     * @return mixed
     */
    public static function get($array, $key, $default = null)
    {
        if (array_key_exists($key, $array)) {
            return $array[$key];
        }

        return $default;
    }

    /**
     * Return a copy of the object, filtered to only have values for the whitelisted keys (or array of valid keys).
     * @param  array  $array
     * @param  array  $keys
     * @return array
     */
    public static function pick($array, $keys)
    {
        $result = [];

        foreach ($array as $key => $value) {
            if (in_array($key, $keys)) {
                $result[$key] = $value;
            }
        }

        return $result;
    }

    /**
     * Return whether or not a set of keys exists in an array
     *
     * @param  array        $array
     * @param  array|mixed  $keys
     *
     * @return bool
     */
    public static function contains($array, $keys)
    {
        if (!is_array($keys)) {
            $keys = array($keys);
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
     * @param  array   $array
     * @param  string  $prepend
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
     * @param  array   $array
     * @param  string  $prepend
     * @return array
     */
    public static function flatKey($separator, $array, $prepend = '')
    {
        $results = [];

        foreach ($array as $key => $value) {
            if (is_array($value) && ! empty($value)) {
                $results = array_merge($results, static::flatKey($separator, $value, $prepend.$key.$separator));
            } else {
                $results[$prepend.$key] = $value;
            }
        }

        return $results;
    }

}
