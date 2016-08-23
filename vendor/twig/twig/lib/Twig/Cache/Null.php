<?php

/*
 * This file is part of Twig.
 *
 * (c) 2015 Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Implements a no-cache strategy.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Twig_Cache_Null implements Twig_CacheInterface
{
    /**
     * {@inheritdoc}
     */
    public function generateKey($name, $className)
    {
        return '';
    }

    /**
     * {@inheritdoc}
     */
    public function write($key, $content)
    {
    }

    /**
     * {@inheritdoc}
     */
    public function load($key)
    {
    }

    /**
     * {@inheritdoc}
     */
    public function getTimestamp($key)
    {
        return 0;
    }
}
