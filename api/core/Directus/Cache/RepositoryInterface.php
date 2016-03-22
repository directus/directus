<?php

namespace Directus\Cache;

use Closure;

interface RepositoryInterface
{
    /**
     * Determine whether an item exists
     *
     * @param  string  $key
     * @return bool
     */
    public function has($key);

    /**
     * Read an item from cache
     *
     * @param  string  $key
     * @param  mixed   $default
     * @return mixed
     */
    public function read($key, $default = null);

    /**
     * Read an item from cache and delete it.
     *
     * @param  string  $key
     * @param  mixed   $default
     * @return mixed
     */
    public function readAndDelete($key, $default = null);

    /**
     * Put an item in cache.
     *
     * @param  string  $key
     * @param  mixed   $value
     * @param  int  $seconds
     * @return void
     */
    public function put($key, $value, $seconds);

    /**
     * Read an item from the cache, or put the default value.
     *
     * @param  string  $key
     * @param  int  $seconds
     * @param  Closure  $callback
     * @return mixed
     */
    public function readOrPut($key, $seconds, Closure $callback);

    /**
     * Delete an item from cache.
     *
     * @param  string $key
     * @return bool
     */
    public function delete($key);
}
