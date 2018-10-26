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

use Doctrine\Common\Cache\Cache;
use Symfony\Component\Validator\Mapping\ClassMetadata;

/**
 * Adapts a Doctrine cache to a CacheInterface.
 *
 * @author Florian Voutzinos <florian@voutzinos.com>
 */
final class DoctrineCache implements CacheInterface
{
    private $cache;

    public function __construct(Cache $cache)
    {
        $this->cache = $cache;
    }

    public function setCache(Cache $cache)
    {
        $this->cache = $cache;
    }

    /**
     * {@inheritdoc}
     */
    public function has($class)
    {
        return $this->cache->contains($class);
    }

    /**
     * {@inheritdoc}
     */
    public function read($class)
    {
        return $this->cache->fetch($class);
    }

    /**
     * {@inheritdoc}
     */
    public function write(ClassMetadata $metadata)
    {
        $this->cache->save($metadata->getClassName(), $metadata);
    }
}
