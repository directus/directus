<?php

namespace Doctrine\Common\Cache;

use MongoCollection;
use MongoDB\Collection;
use const E_USER_DEPRECATED;
use function trigger_error;

/**
 * MongoDB cache provider.
 */
class MongoDBCache extends CacheProvider
{
    /**
     * The data field will store the serialized PHP value.
     */
    public const DATA_FIELD = 'd';

    /**
     * The expiration field will store a MongoDate value indicating when the
     * cache entry should expire.
     *
     * With MongoDB 2.2+, entries can be automatically deleted by MongoDB by
     * indexing this field with the "expireAfterSeconds" option equal to zero.
     * This will direct MongoDB to regularly query for and delete any entries
     * whose date is older than the current time. Entries without a date value
     * in this field will be ignored.
     *
     * The cache provider will also check dates on its own, in case expired
     * entries are fetched before MongoDB's TTLMonitor pass can expire them.
     *
     * @see http://docs.mongodb.org/manual/tutorial/expire-data/
     */
    public const EXPIRATION_FIELD = 'e';

    /** @var CacheProvider */
    private $provider;

    /**
     * This provider will default to the write concern and read preference
     * options set on the collection instance (or inherited from MongoDB or
     * MongoClient). Using an unacknowledged write concern (< 1) may make the
     * return values of delete() and save() unreliable. Reading from secondaries
     * may make contain() and fetch() unreliable.
     *
     * @see http://www.php.net/manual/en/mongo.readpreferences.php
     * @see http://www.php.net/manual/en/mongo.writeconcerns.php
     * @param MongoCollection|Collection $collection
     */
    public function __construct($collection)
    {
        if ($collection instanceof MongoCollection) {
            @trigger_error('Using a MongoCollection instance for creating a cache adapter is deprecated and will be removed in 2.0', E_USER_DEPRECATED);
            $this->provider = new LegacyMongoDBCache($collection);
        } elseif ($collection instanceof Collection) {
            $this->provider = new ExtMongoDBCache($collection);
        } else {
            throw new \InvalidArgumentException('Invalid collection given - expected a MongoCollection or MongoDB\Collection instance');
        }
    }

    /**
     * {@inheritdoc}
     */
    protected function doFetch($id)
    {
        return $this->provider->doFetch($id);
    }

    /**
     * {@inheritdoc}
     */
    protected function doContains($id)
    {
        return $this->provider->doContains($id);
    }

    /**
     * {@inheritdoc}
     */
    protected function doSave($id, $data, $lifeTime = 0)
    {
        return $this->provider->doSave($id, $data, $lifeTime);
    }

    /**
     * {@inheritdoc}
     */
    protected function doDelete($id)
    {
        return $this->provider->doDelete($id);
    }

    /**
     * {@inheritdoc}
     */
    protected function doFlush()
    {
        return $this->provider->doFlush();
    }

    /**
     * {@inheritdoc}
     */
    protected function doGetStats()
    {
        return $this->provider->doGetStats();
    }
}
