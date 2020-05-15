<?php

namespace Directus\Config;

/**
 * Config context interface.
 */
class Context
{
    /**
     * Transforms an array of strings into a complex object.
     *
     * @example
     *  $obj = Context::expand(['a', 'b', 'c'], 12345);
     *  $obj == [
     *    'a' => [
     *      'b' => [
     *        'c' => 12345
     *      ]
     *    ]
     *  ];
     */
    private static function expand(&$target, $path, $value)
    {
        $segment = array_shift($path);
        if (sizeof($path) === 0) { // leaf
            if (!is_array($target)) {
                // TODO: raise warning - overwriting value
                $target = [];
            }
            if (array_key_exists($segment, $target)) {
                // TODO: raise warning - overwriting group
            }
            $target[$segment] = $value;

            return;
        }
        if (!isset($target[$segment])) {
            $target[$segment] = [];
        }
        if (!is_array($target[$segment])) {
            $target[$segment] = [];
        }
        Context::expand($target[$segment], $path, $value);
    }

    /**
     * Normalize the array indexes.
     */
    private static function normalize(&$target)
    {
        if (!is_array($target)) {
            return;
        }

        $sort = false;
        foreach ($target as $key => $value) {
            Context::normalize($target[$key]);
            $sort |= is_numeric($key);
        }

        if ($sort) {
            // TODO: which one?
            sort($target, SORT_NUMERIC);
            // vs.
            //$target = array_values($target);
        }
    }

    /**
     * Source.
     */
    public static function from_map($source)
    {
        $target = [];
        ksort($source);
        foreach ($source as $key => $value) {
            Context::expand($target, explode('_', strtolower($key)), $value);
        }
        Context::normalize($target);

        return $target;
    }

    /**
     * Create.
     */
    public static function from_env()
    {
        if (empty($_ENV)) {
            throw new \Error('No environment variables available. Check php_ini "variables_order" value.');
        }

        return Context::from_map($_ENV);
    }

    /**
     * Loads variables from PHP file.
     */
    public static function from_file($file)
    {
        return require $file;
    }

    /**
     * Loads variables from PHP file.
     */
    public static function from_array($array)
    {
        return $array;
    }

    /**
     * Loads variables from JSON file.
     */
    public static function from_json($file)
    {
        return json_decode(file_get_contents($file));
    }

    /**
     * Checks if under env variables environment.
     *
     * @return bool
     */
    public static function is_env()
    {
        return getenv('DIRECTUS_USE_ENV') === '1';
    }
}
