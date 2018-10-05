<?php

namespace Doctrine\Common\Cache;

use MongoBinData;
use MongoCollection;
use MongoCursorException;
use MongoDate;
use const E_USER_DEPRECATED;
use function serialize;
use function time;
use function trigger_error;
use function unserialize;

/**
 * MongoDB cache provider.
 *
 * @internal Do not use - will be removed in 2.0. Use MongoDBCache instead
 */
class LegacyMongoDBCache extends CacheProvider
{
    /** @var MongoCollection */
    private $collection;

    /** @var bool */
    private $expirationIndexCreated = false;

    /**
     * This provider will default to the write concern and read preference
     * options set on the MongoCollection instance (or inherited from MongoDB or
     * MongoClient). Using an unacknowledged write concern (< 1) may make the
     * return values of delete() and save() unreliable. Reading from secondaries
     * may make contain() and fetch() unreliable.
     *
     * @see http://www.php.net/manual/en/mongo.readpreferences.php
     * @see http://www.php.net/manual/en/mongo.writeconcerns.php
     */
    public function __construct(MongoCollection $collection)
    {
        @trigger_error('Using the legacy MongoDB cache provider is deprecated and will be removed in 2.0', E_USER_DEPRECATED);
        $this->collection = $collection;
    }

    /**
     * {@inheritdoc}
     */
    protected function doFetch($id)
    {
        $document = $this->collection->findOne(['_id' => $id], [MongoDBCache::DATA_FIELD, MongoDBCache::EXPIRATION_FIELD]);

        if ($document === null) {
            return false;
        }

        if ($this->isExpired($document)) {
            $this->createExpirationIndex();
            $this->doDelete($id);
            return false;
        }

        return unserialize($document[MongoDBCache::DATA_FIELD]->bin);
    }

    /**
     * {@inheritdoc}
     */
    protected function doContains($id)
    {
        $document = $this->collection->findOne(['_id' => $id], [MongoDBCache::EXPIRATION_FIELD]);

        if ($document === null) {
            return false;
        }

        if ($this->isExpired($document)) {
            $this->createExpirationIndex();
            $this->doDelete($id);
            return false;
        }

        return true;
    }

    /**
     * {@inheritdoc}
     */
    protected function doSave($id, $data, $lifeTime = 0)
    {
        try {
            $result = $this->collection->update(
                ['_id' => $id],
                [
                    '$set' => [
                        MongoDBCache::EXPIRATION_FIELD => ($lifeTime > 0 ? new MongoDate(time() + $lifeTime) : null),
                        MongoDBCache::DATA_FIELD => new MongoBinData(serialize($data), MongoBinData::BYTE_ARRAY),
                    ],
                ],
                ['upsert' => true, 'multiple' => false]
            );
        } catch (MongoCursorException $e) {
            return false;
        }

        return ($result['ok'] ?? 1) == 1;
    }

    /**
     * {@inheritdoc}
     */
    protected function doDelete($id)
    {
        $result = $this->collection->remove(['_id' => $id]);

        return ($result['ok'] ?? 1) == 1;
    }

    /**
     * {@inheritdoc}
     */
    protected function doFlush()
    {
        // Use remove() in lieu of drop() to maintain any collection indexes
        $result = $this->collection->remove();

        return ($result['ok'] ?? 1) == 1;
    }

    /**
     * {@inheritdoc}
     */
    protected function doGetStats()
    {
        $serverStatus = $this->collection->db->command([
            'serverStatus' => 1,
            'locks' => 0,
            'metrics' => 0,
            'recordStats' => 0,
            'repl' => 0,
        ]);

        $collStats = $this->collection->db->command(['collStats' => 1]);

        return [
            Cache::STATS_HITS => null,
            Cache::STATS_MISSES => null,
            Cache::STATS_UPTIME => $serverStatus['uptime'] ?? null,
            Cache::STATS_MEMORY_USAGE => $collStats['size'] ?? null,
            Cache::STATS_MEMORY_AVAILABLE  => null,
        ];
    }

    /**
     * Check if the document is expired.
     *
     * @param array $document
     */
    private function isExpired(array $document) : bool
    {
        return isset($document[MongoDBCache::EXPIRATION_FIELD]) &&
            $document[MongoDBCache::EXPIRATION_FIELD] instanceof MongoDate &&
            $document[MongoDBCache::EXPIRATION_FIELD]->sec < time();
    }


    private function createExpirationIndex() : void
    {
        if ($this->expirationIndexCreated) {
            return;
        }

        $this->expirationIndexCreated = true;
        $this->collection->createIndex([MongoDBCache::EXPIRATION_FIELD => 1], ['background' => true, 'expireAfterSeconds' => 0]);
    }
}
