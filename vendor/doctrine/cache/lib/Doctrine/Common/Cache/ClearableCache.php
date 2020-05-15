<?php

namespace Doctrine\Common\Cache;

/**
 * Interface for cache that can be flushed.
 *
 * Intended to be used for partial clearing of a cache namespace. For a more
 * global "flushing", see {@see FlushableCache}.
 *
 * @link   www.doctrine-project.org
 */
interface ClearableCache
{
    /**
     * Deletes all cache entries in the current cache namespace.
     *
     * @return bool TRUE if the cache entries were successfully deleted, FALSE otherwise.
     */
    public function deleteAll();
}
