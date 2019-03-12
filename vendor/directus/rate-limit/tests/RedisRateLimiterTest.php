<?php
/**
 * This file is part of the Rate Limit package.
 *
 * Copyright (c) Nikola Posa
 *
 * For full copyright and license information, please refer to the LICENSE file,
 * located at the package root folder.
 */

namespace RateLimit\Tests;

use RateLimit\RateLimiterInterface;
use RateLimit\RedisRateLimiter;
use Redis;

/**
 * @author Nikola Posa <posa.nikola@gmail.com>
 */
class RedisRateLimiterTest extends RateLimiterTest
{
    protected function getRateLimiter($limit, $window)
    {
        $redis = new Redis();

        $success = @ $redis->connect('127.0.0.1');

        if (!$success) {
            $this->markTestSkipped('Cannot connect to Redis.');
        }

        $redis->flushDB();

        return new RedisRateLimiter($redis, $limit, $window);
    }
}
