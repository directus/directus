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
final class RateLimiterFactory
{
    const DEFAULT_LIMIT = 100;
    const DEFAULT_WINDOW = 15 * 60;

    public static function createInMemoryRateLimiter($limit = self::DEFAULT_LIMIT, $window = self::DEFAULT_WINDOW)
    {
        return new InMemoryRateLimiter($limit, $window);
    }

    public static function createRedisBackedRateLimiter(array $redisOptions = [], $limit = self::DEFAULT_LIMIT, $window = self::DEFAULT_WINDOW)
    {
        $redisOptions = array_merge([
            'host' => '127.0.0.1',
            'port' => 6379,
            'timeout' => 0.0,
        ], $redisOptions);

        if (!class_exists('\Redis')) {
            throw new \Exception('\Redis class was not found.');
        }

        $redis = new Redis();

        $redis->connect($redisOptions['host'], $redisOptions['port'], $redisOptions['timeout']);

        return new RedisRateLimiter($redis, $limit, $window);
    }
}
