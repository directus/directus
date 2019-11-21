<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\SessionHandler;

use Psr\Cache\CacheItemPoolInterface;

/**
 * @author Aaron Scherer <aequasi@gmail.com>
 * @author Daniel Bannert <d.bannert@anolilab.de>
 */
class Psr6SessionHandler extends AbstractSessionHandler
{
    /**
     * @type CacheItemPoolInterface
     */
    private $cache;

    /**
     * @type int Time to live in seconds
     */
    private $ttl;

    /**
     * @type string Key prefix for shared environments.
     */
    private $prefix;

    /**
     * @param CacheItemPoolInterface $cache
     * @param array                  $options {
     * @type  int                    $ttl The time to live in seconds
     * @type  string                 $prefix The prefix to use for the cache keys in order to avoid collision
     *                                       }
     *
     * @throws \InvalidArgumentException
     */
    public function __construct(CacheItemPoolInterface $cache, array $options = [])
    {
        $this->cache = $cache;

        if ($diff = array_diff(array_keys($options), ['prefix', 'ttl'])) {
            throw new \InvalidArgumentException(sprintf(
                'The following options are not supported "%s"', implode(', ', $diff)
            ));
        }

        $this->ttl    = isset($options['ttl']) ? (int) $options['ttl'] : 86400;
        $this->prefix = isset($options['prefix']) ? $options['prefix'] : 'psr6ses_';
    }

    /**
     * {@inheritdoc}
     */
    public function updateTimestamp($sessionId, $data)
    {
        $item = $this->getCacheItem($sessionId);
        $item->expiresAt(\DateTime::createFromFormat('U', \time() + $this->ttl));

        return $this->cache->save($item);
    }

    /**
     * {@inheritdoc}
     *
     * @throws \Psr\Cache\InvalidArgumentException
     */
    protected function doRead($sessionId)
    {
        $item = $this->getCacheItem($sessionId);

        if ($item->isHit()) {
            return $item->get();
        }

        return '';
    }

    /**
     * {@inheritdoc}
     *
     * @throws \Psr\Cache\InvalidArgumentException
     */
    protected function doWrite($sessionId, $data)
    {
        $item = $this->getCacheItem($sessionId);
        $item->set($data)
            ->expiresAfter($this->ttl);

        return $this->cache->save($item);
    }

    /**
     * {@inheritdoc}
     *
     * @throws \Psr\Cache\InvalidArgumentException
     */
    protected function doDestroy($sessionId)
    {
        return $this->cache->deleteItem($this->prefix.$sessionId);
    }

    /**
     * @param string $sessionId
     *
     * @throws \Psr\Cache\InvalidArgumentException
     *
     * @return \Psr\Cache\CacheItemInterface
     */
    private function getCacheItem($sessionId)
    {
        return $this->cache->getItem($this->prefix.$sessionId);
    }
}
