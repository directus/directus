<?php

namespace Directus\Session;

use Directus\Session\Storage\SessionStorageInterface;

class Session
{
    /**
     * Session Storage
     *
     * @var SessionStorageInterface
     */
    protected $storage = null;

    /**
     * Constructor
     *
     * @param SessionStorageInterface $storage Session Storage Adapter
     */
    public function __construct(SessionStorageInterface $storage)
    {
        $this->storage = $storage;
    }

    /**
     * Get Session storage
     *
     * @return SessionStorageInterface
     */
    public function getStorage()
    {
        return $this->storage;
    }

    /**
     * Proxy all undefined method to the storage
     *
     * @param  string $method
     * @param  array $arguments
     *
     * @return mixed
     */
    public function __call($method, $arguments)
    {
        return call_user_func_array([$this->storage, $method], $arguments);
    }
}
