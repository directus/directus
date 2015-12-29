<?php

namespace Directus\Util;

class ArrayUtils
{
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
