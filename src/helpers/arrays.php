<?php

namespace Directus;

use Directus\Util\ArrayUtils;

if (!function_exists('array_get')) {
    function array_get(array $array, $key, $default = null)
    {
        return ArrayUtils::get($array, $key, $default);
    }
}

if (!function_exists('array_pick')) {
    function array_pick(array $array, $keys)
    {
        return ArrayUtils::pick($array, $keys);
    }
}

if (!function_exists('array_rename')) {
    function array_rename(array &$array, $from, $to = null)
    {
        if (is_array($from)) {
            ArrayUtils::renameSome($array, $from);
        } else {
            ArrayUtils::rename($array, $from, $to);
        }
    }
}
