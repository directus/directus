<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Config;

use Symfony\Component\Config\Resource\ResourceInterface;

/**
 * Interface for ConfigCache.
 *
 * @author Matthias Pigulla <mp@webfactory.de>
 */
interface ConfigCacheInterface
{
    /**
     * Gets the cache file path.
     *
     * @return string The cache file path
     */
    public function getPath();

    /**
     * Checks if the cache is still fresh.
     *
     * This check should take the metadata passed to the write() method into consideration.
     *
     * @return bool Whether the cache is still fresh
     */
    public function isFresh();

    /**
     * Writes the given content into the cache file. Metadata will be stored
     * independently and can be used to check cache freshness at a later time.
     *
     * @param string                   $content  The content to write into the cache
     * @param ResourceInterface[]|null $metadata An array of ResourceInterface instances
     *
     * @throws \RuntimeException When the cache file cannot be written
     */
    public function write($content, array $metadata = null);
}
