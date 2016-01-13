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
     * @param  AssocArray  $array
     * @param  Array       $keys
     * @return AssocArray
     */
    public static function pick($array, $keys)
    {
        $result = [];

        foreach($array as $key => $value) {
            if (in_array($key, $keys)) {
                $result[$key] = $value;
            }
        }

        return $result;
    }

}
