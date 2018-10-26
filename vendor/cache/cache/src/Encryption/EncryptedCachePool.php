<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Encryption;

use Cache\TagInterop\TaggableCacheItemPoolInterface;
use Defuse\Crypto\Key;
use Psr\Cache\CacheItemInterface;
use Psr\Cache\InvalidArgumentException;

/**
 * Wraps a CacheItemInterface with EncryptedItemDecorator.
 *
 * @author Daniel Bannert <d.bannert@anolilab.de>
 */
class EncryptedCachePool implements TaggableCacheItemPoolInterface
{
    /**
     * @type TaggableCacheItemPoolInterface
     */
    private $cachePool;

    /**
     * @type Key
     */
    private $key;

    /**
     * @param TaggableCacheItemPoolInterface $cachePool
     * @param Key                            $key
     */
    public function __construct(TaggableCacheItemPoolInterface $cachePool, Key $key)
    {
        $this->cachePool = $cachePool;
        $this->key       = $key;
    }

    /**
     * {@inheritdoc}
     */
    public function getItem($key)
    {
        $items = $this->getItems([$key]);

        return reset($items);
    }

    /**
     * {@inheritdoc}
     */
    public function getItems(array $keys = [])
    {
        return array_map(function (CacheItemInterface $inner) {
            if (!($inner instanceof EncryptedItemDecorator)) {
                return new EncryptedItemDecorator($inner, $this->key);
            }

            return $inner;
        }, $this->cachePool->getItems($keys));
    }

    /**
     * {@inheritdoc}
     */
    public function hasItem($key)
    {
        return $this->cachePool->hasItem($key);
    }

    /**
     * {@inheritdoc}
     */
    public function clear()
    {
        return $this->cachePool->clear();
    }

    /**
     * {@inheritdoc}
     */
    public function deleteItem($key)
    {
        return $this->cachePool->deleteItem($key);
    }

    /**
     * {@inheritdoc}
     */
    public function deleteItems(array $keys)
    {
        return $this->cachePool->deleteItems($keys);
    }

    /**
     * {@inheritdoc}
     */
    public function save(CacheItemInterface $item)
    {
        if (!$item instanceof EncryptedItemDecorator) {
            throw new InvalidArgumentException('Cache items are not transferable between pools. Item MUST implement EncryptedItemDecorator.');
        }

        return $this->cachePool->save($item->getCacheItem());
    }

    /**
     * {@inheritdoc}
     */
    public function saveDeferred(CacheItemInterface $item)
    {
        if (!$item instanceof EncryptedItemDecorator) {
            throw new InvalidArgumentException('Cache items are not transferable between pools. Item MUST implement EncryptedItemDecorator.');
        }

        return $this->cachePool->saveDeferred($item->getCacheItem());
    }

    /**
     * {@inheritdoc}
     */
    public function commit()
    {
        return $this->cachePool->commit();
    }

    /**
     * {@inheritdoc}
     */
    public function invalidateTags(array $tags)
    {
        return $this->cachePool->invalidateTags($tags);
    }

    /**
     * {@inheritdoc}
     */
    public function invalidateTag($tag)
    {
        return $this->cachePool->invalidateTag($tag);
    }
}
