<?php

namespace Directus\Filesystem\StorageAdapter;

use League\Flysystem\Adapter\Local;
use League\Flysystem\AdapterInterface;

class LocalStorageAdapter extends AbstractStorageAdapter
{

    /**
     * @return AdapterInterface
     */
    public function getAdapter()
    {
        $root = $this->config['root'] ?: '/';
        return new Local($root);
    }

    /**
     * @return array
     */
    public function getConfig()
    {
        return [];
    }
}
