<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Taggable\Tests;

use Cache\IntegrationTests\TaggableCachePoolTest;
use Cache\Taggable\TaggablePSR6PoolAdapter;
use Symfony\Component\Cache\Adapter\ArrayAdapter as SymfonyArrayAdapter;

class SeparateTagPoolPSR6AdapterTest extends TaggableCachePoolTest
{
    public function createCachePool()
    {
        return TaggablePSR6PoolAdapter::makeTaggable(new SymfonyArrayAdapter(), new SymfonyArrayAdapter());
    }
}
