<?php

namespace Directus\Filesystem;

use Directus\Bootstrap;
use League\Flysystem\Filesystem as Flysystem;
use League\Flysystem\FilesystemInterface as FlysystemInterface;
use League\Flysystem\AdapterInterface;

class Filesystem
{
    private $adapter = null;

    public function __construct(FlysystemInterface $adapter)
    {
        $this->adapter = $adapter;
    }

    /**
     * Check whether a file exists.
     *
     * @param string $path
     *
     * @return bool
     */
    public function exists($path)
    {
        return $this->adapter->has($path);
    }

    /**
     * Get the filesystem adapter (flysystem object)
     *
     * @return Flysystem
     */
    public function getAdapter()
    {
        return $this->adapter;
    }

    /**
     * Get Filesystem adapter path
     *
     * @return string
     */
    public function getPath()
    {
        return $this->adapter->getAdapter()->getPathPrefix();
    }
}