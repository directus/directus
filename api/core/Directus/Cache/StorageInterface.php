<?php

namespace Directus\Cache;

interface StorageInterface
{
    /**
     * Read an item from cache by key.
     *
     * @param  string  $key
     * @return mixed
     */
    public function read($key);

    /**
     * Put a value in cache by key for a given number of minutes.
     *
     * @param  string  $key
     * @param  mixed   $value
     * @param  int     $seconds
     * @return void
     */
    public function put($key, $value, $seconds);

    /**
     * Remove an item from the cache by key.
     *
     * @param  string  $key
     * @return bool
     */
    public function delete($key);

    /**
     * Remove all items from the cache.
     *
     * @return void
     */
    public function flush();

    /**
     * Get the cache key prefix.
     *
     * @return string
     */
    public function getPrefix();
}
