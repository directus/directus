<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\Memcached\Tests;

use Cache\Adapter\Memcached\MemcachedCachePool;

trait CreatePoolTrait
{
    private $client = null;

    public function createCachePool()
    {
        return new MemcachedCachePool($this->getClient());
    }

    public function createSimpleCache()
    {
        return $this->createCachePool();
    }

    private function getClient()
    {
        if ($this->client === null) {
            $this->client = new \Memcached();
            $this->client->addServer('localhost', 11211);
        }

        return $this->client;
    }
}
