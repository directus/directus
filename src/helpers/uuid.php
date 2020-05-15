<?php

namespace Directus;

use Ramsey\Uuid\Uuid;

if (!function_exists('generate_uuid1')) {
    /**
     * Generates a UUID v1 string
     *
     * @return string
     */
    function generate_uuid1()
    {
        return Uuid::uuid1()->toString();
    }
}

if (!function_exists('generate_uuid3')) {
    /**
     * Generates a UUID v3 string
     *
     * @param string $namespace
     * @param string $name
     *
     * @return string
     */
    function generate_uuid3($namespace, $name)
    {
        return Uuid::uuid3(
            $namespace,
            $name
        )->toString();
    }
}

if (!function_exists('generate_uuid4')) {
    /**
     * Generates a UUID v4 string
     *
     * @return string
     */
    function generate_uuid4()
    {
        return Uuid::uuid4()->toString();
    }
}

if (!function_exists('generate_uuid5')) {
    /**
     * Generates a UUID v5 string
     *
     * @param string $namespace
     * @param string $name
     *
     * @return string
     */
    function generate_uuid5($namespace, $name)
    {
        if ($namespace === null) {
            $namespace = Uuid::NAMESPACE_DNS;
        }

        return Uuid::uuid5(
            $namespace,
            $name
        )->toString();
    }
}
