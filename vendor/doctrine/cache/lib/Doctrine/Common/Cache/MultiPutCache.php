<?php

namespace Doctrine\Common\Cache;

/**
 * Interface for cache drivers that allows to put many items at once.
 *
 * @link   www.doctrine-project.org
 * @deprecated
 */
interface MultiPutCache
{
    /**
     * Returns a boolean value indicating if the operation succeeded.
     *
     * @param array $keysAndValues Array of keys and values to save in cache
     * @param int   $lifetime      The lifetime. If != 0, sets a specific lifetime for these
     *                             cache entries (0 => infinite lifeTime).
     *
     * @return bool TRUE if the operation was successful, FALSE if it wasn't.
     */
    public function saveMultiple(array $keysAndValues, $lifetime = 0);
}
