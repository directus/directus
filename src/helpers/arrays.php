<?php

namespace Directus;

use Directus\Util\ArrayUtils;

if (!function_exists('array_get')) {
    function array_get(array $array, $key, $default = null)
    {
        return ArrayUtils::get($array, $key, $default);
    }
}
