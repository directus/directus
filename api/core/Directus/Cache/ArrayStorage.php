<?php

namespace Directus\Cache;

class ArrayStorage implements StorageInterface
{
    /**
     * List of stored values.
     *
     * @var array
     */
    protected $storage = [];

    /**
     * @inheritDoc
     */
    public function read($key)
    {
        if (array_key_exists($key, $this->storage)) {
            return $this->storage[$key];
        }
    }

    /**
     * @inheritDoc
     */
    public function put($key, $value, $seconds)
    {
        $this->storage[$key] = $value;
    }

    /**
     * @inheritDoc
     */
    public function delete($key)
    {
        unset($this->storage[$key]);

        return true;
    }

    /**
     * @inheritDoc
     */
    public function flush()
    {
        $this->storage = [];
    }

    /**
     * @inheritDoc
     */
    public function getPrefix()
    {
        return '';
    }
}
