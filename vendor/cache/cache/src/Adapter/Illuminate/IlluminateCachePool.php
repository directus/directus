<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\Illuminate;

use Cache\Adapter\Common\AbstractCachePool;
use Cache\Adapter\Common\PhpCacheItem;
use Illuminate\Contracts\Cache\Store;

/**
 * This is a bridge between PSR-6 and an Illuminate cache store.
 *
 * @author Florian Voutzinos <florian@voutzinos.com>
 */
class IlluminateCachePool extends AbstractCachePool
{
    /**
     * @type Store
     */
    protected $store;

    /**
     * @param Store $store
     */
    public function __construct(Store $store)
    {
        $this->store = $store;
    }

    /**
     * {@inheritdoc}
     */
    protected function storeItemInCache(PhpCacheItem $item, $ttl)
    {
        $ttl = null === $ttl ? 0 : $ttl / 60;

        $data = serialize([true, $item->get(), $item->getTags(), $item->getExpirationTimestamp()]);

        $this->store->put($item->getKey(), $data, $ttl);

        return true;
    }

    /**
     * {@inheritdoc}
     */
    protected function fetchObjectFromCache($key)
    {
        if (null === $data = $this->store->get($key)) {
            return [false, null, [], null];
        }

        return unserialize($data);
    }

    /**
     * {@inheritdoc}
     */
    protected function clearAllObjectsFromCache()
    {
        return $this->store->flush();
    }

    /**
     * {@inheritdoc}
     */
    protected function clearOneObjectFromCache($key)
    {
        return $this->store->forget($key);
    }

    /**
     * {@inheritdoc}
     */
    protected function getList($name)
    {
        $list = $this->store->get($name);

        if (!is_array($list)) {
            return [];
        }

        return $list;
    }

    /**
     * {@inheritdoc}
     */
    protected function removeList($name)
    {
        return $this->store->forget($name);
    }

    /**
     * {@inheritdoc}
     */
    protected function appendListItem($name, $key)
    {
        $list   = $this->getList($name);
        $list[] = $key;

        $this->store->forever($name, $list);
    }

    /**
     * {@inheritdoc}
     */
    protected function removeListItem($name, $key)
    {
        $list = $this->getList($name);

        foreach ($list as $i => $item) {
            if ($item === $key) {
                unset($list[$i]);
            }
        }

        $this->store->forever($name, $list);
    }
}
