<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Mapping\Cache;

use Symfony\Component\Validator\Mapping\ClassMetadata;

/**
 * Persists ClassMetadata instances in a cache.
 *
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
interface CacheInterface
{
    /**
     * Returns whether metadata for the given class exists in the cache.
     *
     * @param string $class
     */
    public function has($class);

    /**
     * Returns the metadata for the given class from the cache.
     *
     * @param string $class Class Name
     *
     * @return ClassMetadata|false A ClassMetadata instance or false on miss
     */
    public function read($class);

    /**
     * Stores a class metadata in the cache.
     */
    public function write(ClassMetadata $metadata);
}
