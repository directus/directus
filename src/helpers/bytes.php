<?php

namespace Directus;

if (!function_exists('convert_shorthand_size_to_bytes')) {
    /**
     * Convert shorthand size into bytes
     *
     * @param $size - shorthand size
     *
     * @return int
     */
    function convert_shorthand_size_to_bytes($size)
    {
        $unit = strtolower(preg_replace('/[0-9]/', '', $size));
        $size = intval($size);

        if ($unit) {
            $size *= pow(1024, stripos('bkmgtpezy', $unit[0]));
        }

        return round($size);
    }
}
