<?php

namespace Directus\Filesystem;

use League\Flysystem\Filesystem as Flysystem;
use League\Flysystem\Adapter\Local as LocalAdapter;

class FilesystemFactory
{
    public static function createAdapter(Array $config)
    {
        switch($config['adapter']) {
            case 'local':
            default:
                return new LocalAdapter($config['root']);
        }
    }
}