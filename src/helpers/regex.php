<?php

namespace Directus;

if (!function_exists('regex_ids'))
{
    /**
     * Returns a regular expression pattern for a CSV of IDs
     *
     * @param string $typePattern
     *
     * @return string
     */
    function regex_ids($typePattern)
    {
        return sprintf('%s[,%s+]*', $typePattern, $typePattern);
    }
}

if (!function_exists('regex_numeric_ids'))
{
    /**
     * Returns a numeric regular expression pattern for a CSV of IDs
     *
     * @return string
     */
    function regex_numeric_ids()
    {
        return regex_ids('\d+');
    }
}
