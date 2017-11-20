<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\Common;

use Cache\TagInterop\TaggableCacheItemInterface;

/**
 * @author Tobias Nyholm <tobias.nyholm@gmail.com>
 */
interface PhpCacheItem extends HasExpirationTimestampInterface, TaggableCacheItemInterface
{
    /**
     * Get the current tags. These are not the same tags as getPrevious tags. This
     * is the tags that has been added to the item after the item was fetched from
     * the cache storage.
     *
     * WARNING: This is generally not the function you want to use. Please see
     * `getPreviousTags`.
     *
     * @return array
     */
    public function getTags();
}
