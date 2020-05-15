<?php

namespace Directus;

use Directus\Util\StringUtils;

if (!function_exists('cors_get_allowed_origin')) {
    /**
     * Returns the allowed origin based on the allowed origins list
     *
     * Ex:* 1. null - $requestedOrigin not allowed
     *      2. '*' - $requestedOrigin allowed by wildcard
     *      3. host - $requestedOrigin allowed by the hostname
     *
     * @param array|string $allowedOrigins
     * @param string $requestedOrigin
     *
     * @return null|string
     */
    function cors_get_allowed_origin($allowedOrigins, $requestedOrigin)
    {
        if (is_array($requestedOrigin)) {
            $requestedOrigin = array_shift($requestedOrigin);
        }

        if (!is_array($allowedOrigins)) {
            if (is_string($allowedOrigins)) {
                $allowedOrigins = StringUtils::csv($allowedOrigins);
            } else {
                $allowedOrigins = [$allowedOrigins];
            }
        }

        if (in_array($requestedOrigin, $allowedOrigins)) {
            $allowedOrigin = $requestedOrigin;
        } else if (in_array('*', $allowedOrigins)) {
            $allowedOrigin = !empty($requestedOrigin) ? $requestedOrigin : '*';
        } else {
            $allowedOrigin = null;
        }

        return $allowedOrigin;
    }
}

if (!function_exists('cors_is_origin_allowed')) {
    /**
     * Checks whether an requested host is allowed
     *
     * @param $allowedOrigins
     * @param $requestedOrigin
     *
     * @return bool
     */
    function cors_is_origin_allowed($allowedOrigins, $requestedOrigin)
    {
        return cors_get_allowed_origin($allowedOrigins, $requestedOrigin) !== null;
    }
}
