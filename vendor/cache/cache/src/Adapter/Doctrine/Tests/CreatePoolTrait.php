<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\Doctrine\Tests;

use Cache\Adapter\Doctrine\DoctrineCachePool;
use Doctrine\Common\Cache\FilesystemCache;

trait CreatePoolTrait
{
    private $doctrineCache = null;

    public function createCachePool()
    {
        return new DoctrineCachePool($this->getDoctrineCache());
    }

    private function getDoctrineCache()
    {
        if ($this->doctrineCache === null) {
            $this->doctrineCache = new FilesystemCache(sys_get_temp_dir().'/doctirnecache');
        }

        return $this->doctrineCache;
    }

    public function createSimpleCache()
    {
        return $this->createCachePool();
    }
}
