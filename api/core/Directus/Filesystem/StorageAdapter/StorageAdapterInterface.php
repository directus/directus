<?php

namespace Directus\Filesystem\StorageAdapter;

use League\Flysystem\AdapterInterface;

interface StorageAdapterInterface
{
    /**
     * @return AdapterInterface
     */
    public function getAdapter();

    /**
     * @return array
     */
    public function getConfig();
}