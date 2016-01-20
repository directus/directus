<?php

namespace Directus\Util;

class StringUtils
{
    // Source: http://stackoverflow.com/a/10473026/1772076
    /**
     * Return whether or not a string start with a specific string
     * @param  String  $haystack
     * @param  String  $needle
     * @return Boolean
     */
    public static function startsWith($haystack, $needle)
    {
        // search backwards starting from haystack length characters from the end
        return $needle === "" || strrpos($haystack, $needle, -strlen($haystack)) !== FALSE;
    }

    /**
     * Return whether or not a string end with a specific string
     * @param  String  $haystack
     * @param  String  $needle
     * @return Boolean
     */
    public static function endsWith($haystack, $needle)
    {
        // search forward starting from end minus needle length characters
        return $needle === "" || (($temp = strlen($haystack) - strlen($needle)) >= 0 && strpos($haystack, $needle, $temp) !== FALSE);
    }
}