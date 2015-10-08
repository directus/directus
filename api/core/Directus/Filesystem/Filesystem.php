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

    public function exists($path)
    {
        return $this->adapter->has($path);
    }

    public function getAdapter()
    {
        return $this->adapter;
    }

    public function getPath()
    {
        return $this->adapter->getAdapter()->getPathPrefix();
    }
}