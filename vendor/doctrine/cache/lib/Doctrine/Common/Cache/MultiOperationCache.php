<?php

namespace Doctrine\Common\Cache;

/**
 * Interface for cache drivers that supports multiple items manipulation.
 *
 * @link   www.doctrine-project.org
 */
interface MultiOperationCache extends MultiGetCache, MultiDeleteCache, MultiPutCache
{
}
