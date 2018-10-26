<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\TagInterop;

use Psr\Cache\CacheItemInterface;
use Psr\Cache\InvalidArgumentException;

/**
 * An item that supports tags. This interface is a soon-to-be-PSR.
 *
 * @author Tobias Nyholm <tobias.nyholm@gmail.com>
 * @author Nicolas Grekas <p@tchwork.com>
 */
interface TaggableCacheItemInterface extends CacheItemInterface
{
    /**
     * Get all existing tags. These are the tags the item has when the item is
     * returned from the pool.
     *
     * @return array
     */
    public function getPreviousTags();

    /**
     * Overwrite all tags with a new set of tags.
     *
     * @param string[] $tags An array of tags
     *
     * @throws InvalidArgumentException When a tag is not valid.
     *
     * @return TaggableCacheItemInterface
     */
    public function setTags(array $tags);
}
