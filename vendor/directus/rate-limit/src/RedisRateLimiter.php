<?php
/**
 * This file is part of the Rate Limit package.
 *
 * Copyright (c) Nikola Posa
 *
 * For full copyright and license information, please refer to the LICENSE file,
 * located at the package root folder.
 */

namespace RateLimit;

use Redis;

/**
 * @author Nikola Posa <posa.nikola@gmail.com>
 */
final class RedisRateLimiter extends AbstractRateLimiter
{
    /**
     * @var Redis
     */
    private $redis;

    public function __construct(Redis $redis, $limit, $window)
    {
        $this->redis = $redis;

        parent::__construct($limit, $window);
    }

    protected function get($key, $default)
    {
        $value = $this->redis->get((string)$key);

        if (false === $value) {
            return $default;
        }

        return (int) $value;
    }

    protected function init($key)
    {
        $this->redis->setex((string)$key, $this->window, 1);
    }

    protected function increment($key)
    {
        $this->redis->incr((string)$key);
    }

    protected function ttl($key)
    {
        return max((int) ceil($this->redis->pttl($key) / 1000), 0);
    }
}
