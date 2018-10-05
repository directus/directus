<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Bridge\Doctrine;

use Doctrine\Common\Cache\Cache;
use Doctrine\Common\Cache\CacheProvider;
use Psr\Cache\CacheItemPoolInterface;

/**
 * This is a bridge between a Doctrine cache and PSR6.
 *
 * @author Aaron Scherer <aequasi@gmail.com>
 */
class DoctrineCacheBridge extends CacheProvider
{
    /**
     * @type CacheItemPoolInterface
     */
    private $cachePool;

    /**
     * DoctrineCacheBridge constructor.
     *
     * @param CacheItemPoolInterface $cachePool
     */
    public function __construct(CacheItemPoolInterface $cachePool)
    {
        $this->cachePool = $cachePool;
    }

    /**
     * @return CacheItemPoolInterface
     */
    public function getCachePool()
    {
        return $this->cachePool;
    }

    /**
     * Fetches an entry from the cache.
     *
     * @param string $id The id of the cache entry to fetch.
     *
     * @return mixed|false The cached data or FALSE, if no cache entry exists for the given id.
     */
    protected function doFetch($id)
    {
        $item = $this->cachePool->getItem($this->normalizeKey($id));

        if ($item->isHit()) {
            return $item->get();
        }

        return false;
    }

    /**
     * Tests if an entry exists in the cache.
     *
     * @param string $id The cache id of the entry to check for.
     *
     * @return bool TRUE if a cache entry exists for the given cache id, FALSE otherwise.
     */
    protected function doContains($id)
    {
        return $this->cachePool->hasItem($this->normalizeKey($id));
    }

    /**
     * Puts data into the cache.
     *
     * @param string $id       The cache id.
     * @param string $data     The cache entry/data.
     * @param int    $lifeTime The lifetime. If != 0, sets a specific lifetime for this
     *                         cache entry (0 => infinite lifeTime).
     *
     * @return bool TRUE if the entry was successfully stored in the cache, FALSE otherwise.
     */
    protected function doSave($id, $data, $lifeTime = 0)
    {
        $item = $this->cachePool->getItem($this->normalizeKey($id));
        $item->set($data);

        if ($lifeTime !== 0) {
            $item->expiresAfter($lifeTime);
        }

        return $this->cachePool->save($item);
    }

    /**
     * Deletes a cache entry.
     *
     * @param string $id The cache id.
     *
     * @return bool TRUE if the cache entry was successfully deleted, FALSE otherwise.
     */
    protected function doDelete($id)
    {
        return $this->cachePool->deleteItem($this->normalizeKey($id));
    }

    /**
     * Flushes all cache entries.
     *
     * @return bool TRUE if the cache entries were successfully flushed, FALSE otherwise.
     */
    protected function doFlush()
    {
        $this->cachePool->clear();
    }

    /**
     * Retrieves cached information from the data store.
     *
     * @since 2.2
     *
     * @return array|null An associative array with server's statistics if available, NULL otherwise.
     */
    protected function doGetStats()
    {
        // Not possible, as of yet
    }

    /**
     * We need to make sure we do not use any characters not supported.
     *
     * @param string $key
     *
     * @return string
     */
    private function normalizeKey($key)
    {
        if (preg_match('|[\{\}\(\)/\\\@\:]|', $key)) {
            return preg_replace('|[\{\}\(\)/\\\@\:]|', '_', $key);
        }

        return $key;
    }
}
