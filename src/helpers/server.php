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
        // NOTE: From php docs
        // This function (get_cfg_var) will not return configuration information set when the PHP was compiled,
        // or read from an Apache configuration file.
        //
        // To check whether the system is using a configuration file,
        // try retrieving the value of the cfg_file_path configuration setting.
        // If this is available, a configuration file is being used.
        if ($global === true && get_cfg_var('cfg_file_path')) {
            $function = 'get_cfg_var';
        }

        $maxUploadSize = convert_shorthand_size_to_bytes(call_user_func($function, 'upload_max_filesize'));
        $maxPostSize = convert_shorthand_size_to_bytes(call_user_func($function, 'post_max_size'));
        
        /* post_max_size = 0 is defined as unlimited */
        if($maxPostSize == 0) {
            return $maxUploadSize;
        }

        return min($maxUploadSize, $maxPostSize);
    }
}
