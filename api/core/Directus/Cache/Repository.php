<?php

namespace Directus\Cache;


use Closure;

class Repository implements RepositoryInterface
{
    /**
     * Cache Storage Object
     * @var \Directus\Cache\StorageInterface
     */
    protected $storage = null;

    public function __construct(StorageInterface $storage)
    {
        $this->storage = $storage;
    }

    /**
     * @inheritDoc
     */
    public function has($key)
    {
        return !is_null($this->storage->read($key));
    }

    /**
     * @inheritDoc
     */
    public function read($key, $default = null)
    {
        $value = $this->storage->read($key);

        if (is_null($value)) {
            $value = $default;
        }

        return $value;
    }

    /**
     * @inheritDoc
     */
    public function readAndDelete($key, $default = null)
    {
        $value = $this->read($key, $default);

        $this->delete($key);

        return $value;
    }

    /**
     * @inheritDoc
     */
    public function put($key, $value, $seconds)
    {
        $this->storage->put($key, $value, $seconds);
    }

    /**
     * @inheritDoc
     */
    public function readOrPut($key, $seconds, Closure $callback)
    {
        $value = $this->read($key);
        if (!is_null($value)) {
            return $value;
        }

        $this->put($key, $value = $callback(), $minutes);

        return $value;
    }

    /**
     * @inheritDoc
     */
    public function delete($key)
    {
        return $this->storage->delete($key);
    }

    /**
     * Pass missing methods to the store.
     *
     * @param  string  $method
     * @param  array   $parameters
     * @return mixed
     */
    public function __call($method, $parameters)
    {
        return call_user_func_array([$this->storage, $method], $parameters);
    }
}
