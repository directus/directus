<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\Redis\Tests;

use Cache\Adapter\Redis\RedisCachePool;

trait CreateRedisArrayCachePoolTrait
{
    private $client = null;

    public function createCachePool()
    {
        return new RedisCachePool($this->getClient());
    }

    private function getClient()
    {
        if ($this->client === null) {
            $this->client = new \RedisArray(['127.0.0.1:6379']);
        }

        return $this->client;
    }

    public function createSimpleCache()
    {
        return $this->createCachePool();
    }
}
