<?php

namespace Directus\Event;

use League\Event\Emitter;

class Event
{
    protected static $instance;

    public static function __callStatic($method, $parameters)
    {
        if (!static::$instance) {
            static::$instance = new Emitter;
        }

        return call_user_func_array([static::$instance, $method], $parameters);
    }
}