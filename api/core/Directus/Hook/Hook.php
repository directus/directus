<?php

namespace Directus\Hook;

class Hook
{
    /**
     * High priority.
     *
     * @const int
     */
    const P_HIGH = 100;

    /**
     * Normal priority.
     *
     * @const int
     */
    const P_NORMAL = 0;

    /**
     * Low priority.
     *
     * @const int
     */
    const P_LOW = -100;

    /**
     * List of registered listeners
     *
     * @var array
     */
    protected static $listeners = [];

    /**
     * List of registered filters
     *
     * @var array
     */
    protected static $filters = [];

    public static function addListener($name, $function, $priority = self::P_NORMAL)
    {
        static::$listeners[$name][$priority][] = $function;
    }

    public static function addFilter($name, $function, $priority = self::P_NORMAL)
    {
        static::$filters[$name][$priority][] = $function;
    }

    public static function run($name)
    {
        $listeners = static::getListeners($name);

        $arguments = array_slice(func_get_args(), 1);
        foreach ($listeners as $listener) {
            call_user_func_array($listener, $arguments);
        }
    }

    public static function apply($name, $value)
    {
        $listeners = static::getFilters($name);

        foreach ($listeners as $listener) {
            $value = call_user_func_array($listener, [$value]);
            $arguments = [$value];
        }

        return $value;
    }

    public static function getListeners($name)
    {
        return static::getFunctions(static::$listeners, $name);
    }

    public static function getFilters($name)
    {
        return static::getFunctions(static::$filters, $name);
    }

    private static function getFunctions(array $items, $name)
    {
        if (array_key_exists($name, $items)) {
            $listeners = $items[$name];
            krsort($listeners);
            return call_user_func_array('array_merge', $listeners);
        }

        return [];
    }
}