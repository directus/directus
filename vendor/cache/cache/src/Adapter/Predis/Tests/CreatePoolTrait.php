<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\Predis\Tests;

use Cache\Adapter\Predis\PredisCachePool;
use Predis\Client;

trait CreatePoolTrait
{
    private $client = null;

    public function createCachePool()
    {
        return new PredisCachePool($this->getClient());
    }

    public function createSimpleCache()
    {
        return $this->createCachePool();
    }

    private function getClient()
    {
        if ($this->client === null) {
            $this->client = new Client('tcp:/127.0.0.1:6379');
        }

        return $this->client;
    }
}
