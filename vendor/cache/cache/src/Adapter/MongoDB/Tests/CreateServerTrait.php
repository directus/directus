<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\MongoDB\Tests;

use Cache\Adapter\MongoDB\MongoDBCachePool;
use MongoDB\Driver\Manager;

trait CreateServerTrait
{
    private $collection = null;

    /**
     * @return mixed
     */
    public function getCollection()
    {
        if ($this->collection === null) {
            $manager = new Manager('mongodb://'.getenv('MONGODB_HOST'));

            // In your own code, only do this *once* to initialize your cache
            $this->collection = MongoDBCachePool::createCollection(
                $manager,
                getenv('MONGODB_DATABASE'),
                getenv('MONGODB_COLLECTION')
            );
        }

        return $this->collection;
    }

    public static function setUpBeforeClass()
    {
        if (!class_exists('\MongoDB\Collection')) {
            static::markTestSkipped('MonogoDB extension not installed.');
        }

        parent::setUpBeforeClass();
    }
}
