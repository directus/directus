<?php

namespace Directus;

if (!function_exists('get_max_upload_size')) {
    /**
     * Get the maximum upload size in bytes
     *
     * @param bool $global
     *
     * @return int
     */
    function get_max_upload_size($global = false)
    {
        $function = 'ini_get';
        if ($global === true) {
            $function = 'get_cfg_var';
        }

        $maxUploadSize = convert_shorthand_size_to_bytes(call_user_func($function, 'upload_max_filesize'));
        $maxPostSize = convert_shorthand_size_to_bytes(call_user_func($function, 'post_max_size'));

        return min($maxUploadSize, $maxPostSize);
    }
}
