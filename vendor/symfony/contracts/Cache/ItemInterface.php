<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Contracts\Cache;

use Psr\Cache\CacheException;
use Psr\Cache\CacheItemInterface;
use Psr\Cache\InvalidArgumentException;

/**
 * Augments PSR-6's CacheItemInterface with support for tags and metadata.
 *
 * @author Nicolas Grekas <p@tchwork.com>
 */
interface ItemInterface extends CacheItemInterface
{
    /**
     * References the Unix timestamp stating when the item will expire.
     */
    const METADATA_EXPIRY = 'expiry';

    /**
     * References the time the item took to be created, in milliseconds.
     */
    const METADATA_CTIME = 'ctime';

    /**
     * References the list of tags that were assigned to the item, as string[].
     */
    const METADATA_TAGS = 'tags';

    /**
     * Adds a tag to a cache item.
     *
     * Tags are strings that follow the same validation rules as keys.
     *
     * @param string|string[] $tags A tag or array of tags
     *
     * @return $this
     *
     * @throws InvalidArgumentException When $tag is not valid
     * @throws CacheException           When the item comes from a pool that is not tag-aware
     */
    public function tag($tags): self;

    /**
     * Returns a list of metadata info that were saved alongside with the cached value.
     *
     * See ItemInterface::METADATA_* consts for keys potentially found in the returned array.
     */
    public function getMetadata(): array;
}
