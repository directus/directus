<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Interface implemented by cache classes.
 *
 * It is highly recommended to always store templates on the filesystem to
 * benefit from the PHP opcode cache. This interface is mostly useful if you
 * need to implement a custom strategy for storing templates on the filesystem.
 *
 * @author Andrew Tch <andrew@noop.lv>
 */
interface Twig_CacheInterface
{
    /**
     * Generates a cache key for the given template class name.
     *
     * @param string $name      The template name
     * @param string $className The template class name
     *
     * @return string
     */
    public function generateKey($name, $className);

    /**
     * Writes the compiled template to cache.
     *
     * @param string $key     The cache key
     * @param string $content The template representation as a PHP class
     */
    public function write($key, $content);

    /**
     * Loads a template from the cache.
     *
     * @param string $key The cache key
     */
    public function load($key);

    /**
     * Returns the modification timestamp of a key.
     *
     * @param string $key The cache key
     *
     * @return int
     */
    public function getTimestamp($key);
}

class_alias('Twig_CacheInterface', 'Twig\Cache\CacheInterface', false);
