<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\MongoDB;

use Cache\Adapter\Common\AbstractCachePool;
use Cache\Adapter\Common\JsonBinaryArmoring;
use Cache\Adapter\Common\PhpCacheItem;
use Cache\Adapter\Common\TagSupportWithArray;
use MongoDB\Collection;
use MongoDB\Driver\Manager;

/**
 * @author Tobias Nyholm <tobias.nyholm@gmail.com>
 * @author Magnus Nordlander
 */
class MongoDBCachePool extends AbstractCachePool
{
    use JsonBinaryArmoring;
    use TagSupportWithArray;

    /**
     * @type Collection
     */
    private $collection;

    /**
     * @param Collection $collection
     */
    public function __construct(Collection $collection)
    {
        $this->collection = $collection;
    }

    /**
     * @param Manager $manager
     * @param string  $database
     * @param string  $collection
     *
     * @return Collection
     */
    public static function createCollection(Manager $manager, $database, $collection)
    {
        $collection = new Collection($manager, $database, $collection);
        $collection->createIndex(['expireAt' => 1], ['expireAfterSeconds' => 0]);

        return $collection;
    }

    /**
     * {@inheritdoc}
     */
    protected function fetchObjectFromCache($key)
    {
        $object = $this->collection->findOne(['_id' => $key]);

        if (!$object || !isset($object->data)) {
            return [false, null, [], null];
        }

        if (isset($object->expiresAt)) {
            if ($object->expiresAt < time()) {
                return [false, null, [], null];
            }
        }

        return [
            true,
            $this->thawValue($object->data),
            $this->thawValue($object->tags),
            $object->expirationTimestamp,
        ];
    }

    /**
     * {@inheritdoc}
     */
    protected function clearAllObjectsFromCache()
    {
        $this->collection->deleteMany([]);

        return true;
    }

    /**
     * {@inheritdoc}
     */
    protected function clearOneObjectFromCache($key)
    {
        $this->collection->deleteOne(['_id' => $key]);

        return true;
    }

    /**
     * {@inheritdoc}
     */
    protected function storeItemInCache(PhpCacheItem $item, $ttl)
    {
        $object = [
            '_id'                 => $item->getKey(),
            'data'                => $this->freezeValue($item->get()),
            'tags'                => $this->freezeValue($item->getTags()),
            'expirationTimestamp' => $item->getExpirationTimestamp(),
        ];

        if ($ttl) {
            $object['expiresAt'] = time() + $ttl;
        }

        $this->collection->updateOne(['_id' => $item->getKey()], ['$set' => $object], ['upsert' => true]);

        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function getDirectValue($name)
    {
        $object = $this->collection->findOne(['_id' => $name]);
        if (!$object || !isset($object->data)) {
            return;
        }

        return $this->thawValue($object->data);
    }

    /**
     * {@inheritdoc}
     */
    public function setDirectValue($name, $value)
    {
        $object = [
            '_id'  => $name,
            'data' => $this->freezeValue($value),
        ];

        $this->collection->updateOne(['_id' => $name], ['$set' => $object], ['upsert' => true]);
    }

    private function freezeValue($value)
    {
        return static::jsonArmor(serialize($value));
    }

    private function thawValue($value)
    {
        return unserialize(static::jsonDeArmor($value));
    }
}
