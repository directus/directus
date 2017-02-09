<?php

// missing function
// this function was added recently and it's not yet available
// in Directus 6.3.6
if (!function_exists('get_request_ip')) {
    function get_request_ip()
    {
        if (isset($_SERVER['X_FORWARDED_FOR'])) {
            return $_SERVER['X_FORWARDED_FOR'];
        } elseif (isset($_SERVER['CLIENT_IP'])) {
            return $_SERVER['CLIENT_IP'];
        }
        return $_SERVER['REMOTE_ADDR'];
    }
}