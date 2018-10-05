<?php

namespace Directus;

if (!function_exists('sorting_by_key')) {
    /**
     * Sorting callable helper
     *
     * @param string $key
     * @param string $order
     *
     * @return \Closure
     */
    function sorting_by_key($key, $order = 'ASC')
    {
        return function ($a, $b) use ($key, $order) {
            if ($a[$key] === $b[$key]) {
                return 0;
            }

            $value = $a[$key] < $b[$key] ? -1 : 1;
            if ($order === 'DESC') {
                $value *= -1;
            }

            return $value;
        };
    }
}
