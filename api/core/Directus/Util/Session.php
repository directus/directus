<?php

namespace Directus\Util;

/*
 * Simple Session Wrapper
 */
class Session
{

    public static function start()
    {
        if (session_id() === '') {
            session_start();
        }
    }

    public static function get($key = '')
    {
        if ($key === '') {
            return isset($_SESSION) ? $_SESSION : array();
        }

        return array_key_exists($key, $_SESSION) ? $_SESSION[$key] : false;
    }

    public static function set($key, $value)
    {
        $_SESSION[$key] = $value;
    }
}
