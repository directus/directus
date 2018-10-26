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

use PHPUnit_Framework_TestCase;
use RateLimit\RateLimiterFactory;
use RateLimit\InMemoryRateLimiter;
use RateLimit\RedisRateLimiter;

/**
 * @author Nikola Posa <posa.nikola@gmail.com>
 */
class RateLimiterFactoryTest extends PHPUnit_Framework_TestCase
{
    /**
     * @test
     */
    public function it_creates_default_in_memory_rate_limiter()
    {
        $rateLimiter = RateLimiterFactory::createInMemoryRateLimiter();

        $this->assertInstanceOf(InMemoryRateLimiter::class, $rateLimiter);
    }

    /**
     * @test
     */
    public function it_creates_default_redis_backed_rate_limiter()
    {
        $rateLimiter = RateLimiterFactory::createRedisBackedRateLimiter();

        $this->assertInstanceOf(RedisRateLimiter::class, $rateLimiter);
    }

    /**
     * @test
     */
    public function it_creates_redis_backed_rate_limiter_with_custom_redis_options()
    {
        $rateLimiter = RateLimiterFactory::createRedisBackedRateLimiter([
            'timeout' => 2.5,
        ]);

        $this->assertInstanceOf(RedisRateLimiter::class, $rateLimiter);
    }
}
