<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\Chain\Tests;

use Cache\Adapter\Filesystem\FilesystemCachePool;
use Cache\Adapter\PHPArray\ArrayCachePool;
use League\Flysystem\Adapter\Local;
use League\Flysystem\Filesystem;

/**
 * @author Tobias Nyholm <tobias.nyholm@gmail.com>
 */
trait CreatePoolTrait
{
    private $adapters;

    /**
     * @return mixed
     */
    public function getAdapters()
    {
        if ($this->adapters === null) {
            $filesystemAdapter = new Local(sys_get_temp_dir().'/cache_'.rand(1, 1000));
            $filesystem        = new Filesystem($filesystemAdapter);
            $this->adapters    = [new FilesystemCachePool($filesystem), new ArrayCachePool()];
        }

        return $this->adapters;
    }
}
