<?php

namespace Doctrine\Common\Cache;

use function zend_shm_cache_clear;
use function zend_shm_cache_delete;
use function zend_shm_cache_fetch;
use function zend_shm_cache_store;

/**
 * Zend Data Cache cache driver.
 *
 * @link   www.doctrine-project.org
 */
class ZendDataCache extends CacheProvider
{
    /**
     * {@inheritdoc}
     */
    protected function doFetch($id)
    {
        return zend_shm_cache_fetch($id);
    }

    /**
     * {@inheritdoc}
     */
    protected function doContains($id)
    {
        return zend_shm_cache_fetch($id) !== false;
    }

    /**
     * {@inheritdoc}
     */
    protected function doSave($id, $data, $lifeTime = 0)
    {
        return zend_shm_cache_store($id, $data, $lifeTime);
    }

    /**
     * {@inheritdoc}
     */
    protected function doDelete($id)
    {
        return zend_shm_cache_delete($id);
    }

    /**
     * {@inheritdoc}
     */
    protected function doFlush()
    {
        $namespace = $this->getNamespace();
        if (empty($namespace)) {
            return zend_shm_cache_clear();
        }

        return zend_shm_cache_clear($namespace);
    }

    /**
     * {@inheritdoc}
     */
    protected function doGetStats()
    {
        return null;
    }
}
