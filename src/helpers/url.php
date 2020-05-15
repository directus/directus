<?php

namespace Directus;

if (!function_exists('unparse_url')) {
    /**
     * Unparse URL
     *
     * @param $parsed_url
     *
     * @return string
     */
    function unparse_url($parsed_url)
    {
        $scheme   = isset($parsed_url['scheme']) ? $parsed_url['scheme'] . '://' : '';
        $host     = isset($parsed_url['host']) ? $parsed_url['host'] : '';
        $port     = isset($parsed_url['port']) ? ':' . $parsed_url['port'] : '';
        $user     = isset($parsed_url['user']) ? $parsed_url['user'] : '';
        $pass     = isset($parsed_url['pass']) ? ':' . $parsed_url['pass']  : '';
        $pass     = ($user || $pass) ? "$pass@" : '';
        $path     = isset($parsed_url['path']) ? $parsed_url['path'] : '';
        $query    = isset($parsed_url['query']) ? '?' . $parsed_url['query'] : '';
        $fragment = isset($parsed_url['fragment']) ? '#' . $parsed_url['fragment'] : '';

        return "$scheme$user$pass$host$port$path$query$fragment";
    }
}

if (!function_exists('parse_url_file')) {
    /**
     * Get the info of a file from a url
     *
     * @param $url
     *
     * @return array
     */
    function parse_url_file($url)
    {
        $pathInfo = parse_url($url, PHP_URL_PATH);

        return pathinfo($pathInfo);
    }
}
