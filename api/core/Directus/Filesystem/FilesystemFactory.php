<?php

namespace Directus\Filesystem;

use Directus\Filesystem\StorageAdapter\StorageAdapterInterface;
use League\Flysystem\Filesystem as Flysystem;

class FilesystemFactory
{
    const CLASS_PATH_TEMPLATE = 'Directus\Filesystem\StorageAdapter\%sStorageAdapter';
    const FALLBACK_STORAGE = 'local';

    /**
     * @param array $config
     *
     * @return Flysystem
     */
    public static function createAdapter(Array $config)
    {
        $classname = self::getAdapterClass($config['adapter']);

        if (!class_exists($classname)) {
            $classname = self::getAdapterClass(self::FALLBACK_STORAGE);
        }

        /** @var StorageAdapterInterface $storageAdapter */
        $storageAdapter = new $classname($config);

        return new Flysystem($storageAdapter->getAdapter(), $storageAdapter->getConfig());
    }

    private static function getAdapterClass($name)
    {
        return sprintf(self::CLASS_PATH_TEMPLATE, ucfirst($name));
    }
}
