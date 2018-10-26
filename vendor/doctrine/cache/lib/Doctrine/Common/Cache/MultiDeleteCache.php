<?php

namespace Doctrine\Common\Cache;

/**
 * Interface for cache drivers that allows to put many items at once.
 *
 * @link   www.doctrine-project.org
 * @deprecated
 */
interface MultiDeleteCache
{
    /**
     * Deletes several cache entries.
     *
     * @param string[] $keys Array of keys to delete from cache
     *
     * @return bool TRUE if the operation was successful, FALSE if it wasn't.
     */
    public function deleteMultiple(array $keys);
}
