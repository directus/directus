<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\Apcu;

use Cache\Adapter\Common\AbstractCachePool;
use Cache\Adapter\Common\PhpCacheItem;
use Cache\Adapter\Common\TagSupportWithArray;

/**
 * @author Tobias Nyholm <tobias.nyholm@gmail.com>
 */
class ApcuCachePool extends AbstractCachePool
{
    use TagSupportWithArray;

    /**
     * @type bool
     */
    private $skipOnCli;

    /**
     * @param bool $skipOnCli
     */
    public function __construct($skipOnCli = false)
    {
        $this->skipOnCli = $skipOnCli;
    }

    /**
     * {@inheritdoc}
     */
    protected function fetchObjectFromCache($key)
    {
        if ($this->skipIfCli()) {
            return [false, null, [], null];
        }

        $success   = false;
        $cacheData = apcu_fetch($key, $success);
        if (!$success) {
            return [false, null, [], null];
        }
        list($data, $tags, $timestamp) = unserialize($cacheData);

        return [$success, $data, $tags, $timestamp];
    }

    /**
     * {@inheritdoc}
     */
    protected function clearAllObjectsFromCache()
    {
        return apcu_clear_cache();
    }

    /**
     * {@inheritdoc}
     */
    protected function clearOneObjectFromCache($key)
    {
        apcu_delete($key);

        return true;
    }

    /**
     * {@inheritdoc}
     */
    protected function storeItemInCache(PhpCacheItem $item, $ttl)
    {
        if ($this->skipIfCli()) {
            return false;
        }

        if ($ttl < 0) {
            return false;
        }

        return apcu_store($item->getKey(), serialize([$item->get(), $item->getTags(), $item->getExpirationTimestamp()]), $ttl);
    }

    /**
     * Returns true if CLI and if it should skip on cli.
     *
     * @return bool
     */
    private function skipIfCli()
    {
        return $this->skipOnCli && php_sapi_name() === 'cli';
    }

    /**
     * {@inheritdoc}
     */
    public function getDirectValue($name)
    {
        return apcu_fetch($name);
    }

    /**
     * {@inheritdoc}
     */
    public function setDirectValue($name, $value)
    {
        apcu_store($name, $value);
    }
}
