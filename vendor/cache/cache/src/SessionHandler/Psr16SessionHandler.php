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

use Psr\SimpleCache\CacheInterface;

/**
 * @author Daniel Bannert <d.bannert@anolilab.de>
 */
class Psr16SessionHandler extends AbstractSessionHandler
{
    /**
     * @type CacheInterface
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
     * @param CacheInterface $cache
     * @param array          $options {
     * @type  int            $ttl The time to live in seconds
     * @type  string         $prefix The prefix to use for the cache keys in order to avoid collision
     *                               }
     *
     * @throws \InvalidArgumentException
     */
    public function __construct(CacheInterface $cache, array $options = [])
    {
        $this->cache = $cache;

        if ($diff = array_diff(array_keys($options), ['prefix', 'ttl'])) {
            throw new \InvalidArgumentException(sprintf(
                'The following options are not supported "%s"', implode(', ', $diff)
            ));
        }

        $this->ttl    = isset($options['ttl']) ? (int) $options['ttl'] : 86400;
        $this->prefix = isset($options['prefix']) ? $options['prefix'] : 'psr16ses_';
    }

    /**
     * {@inheritdoc}
     */
    public function updateTimestamp($sessionId, $data)
    {
        $value = $this->cache->get($this->prefix.$sessionId);

        if ($value === null) {
            return false;
        }

        return $this->cache->set(
            $this->prefix.$sessionId,
            $value,
            \DateTime::createFromFormat('U', \time() + $this->ttl)
        );
    }

    /**
     * {@inheritdoc}
     *
     * @throws \Psr\SimpleCache\InvalidArgumentException
     */
    protected function doRead($sessionId)
    {
        return $this->cache->get($this->prefix.$sessionId, '');
    }

    /**
     * {@inheritdoc}
     */
    protected function doWrite($sessionId, $data)
    {
        return $this->cache->set($this->prefix.$sessionId, $data, $this->ttl);
    }

    /**
     * {@inheritdoc}
     */
    protected function doDestroy($sessionId)
    {
        return $this->cache->delete($this->prefix.$sessionId);
    }
}
