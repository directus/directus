<?php

namespace Directus\Config;

interface ConfigInterface
{
    /**
     * Checks whether the config has item with the given key
     *
     * @param $key
     *
     * @return mixed
     */
    public function has($key);

    /**
     * Gets a config value with the given key
     *
     * @param $key
     * @param null $default
     *
     * @return mixed
     */
    public function get($key, $default = null);

    /**
     * Sets a config value with the given key-value
     *
     * @param $key
     * @param $value
     *
     * @return void
     */
    public function set($key, $value);
}