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
 */
class Psr6SessionHandler implements \SessionHandlerInterface
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
     *
     *      @type int $ttl       The time to live in seconds
     *      @type string $prefix The prefix to use for the cache keys in order to avoid collision
     * }
     */
    public function __construct(CacheItemPoolInterface $cache, array $options = [])
    {
        $this->cache = $cache;

        $this->ttl    = isset($options['ttl']) ? (int) $options['ttl'] : 86400;
        $this->prefix = isset($options['prefix']) ? $options['prefix'] : 'psr6ses_';
    }

    /**
     * {@inheritdoc}
     */
    public function open($savePath, $sessionName)
    {
        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function close()
    {
        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function read($sessionId)
    {
        $item = $this->getCacheItem($sessionId);
        if ($item->isHit()) {
            return $item->get();
        }

        return '';
    }

    /**
     * {@inheritdoc}
     */
    public function write($sessionId, $data)
    {
        $item = $this->getCacheItem($sessionId);
        $item->set($data)
            ->expiresAfter($this->ttl);

        return $this->cache->save($item);
    }

    /**
     * {@inheritdoc}
     */
    public function destroy($sessionId)
    {
        return $this->cache->deleteItem($this->prefix.$sessionId);
    }

    /**
     * {@inheritdoc}
     */
    public function gc($lifetime)
    {
        // not required here because cache will auto expire the records anyhow.
        return true;
    }

    /**
     * @param $sessionId
     *
     * @return \Psr\Cache\CacheItemInterface
     */
    private function getCacheItem($sessionId)
    {
        return $this->cache->getItem($this->prefix.$sessionId);
    }
}
