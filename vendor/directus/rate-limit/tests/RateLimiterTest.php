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
use RateLimit\RateLimiterInterface;
use RateLimit\Exception\RateLimitExceededException;

/**
 * @author Nikola Posa <posa.nikola@gmail.com>
 */
abstract class RateLimiterTest extends PHPUnit_Framework_TestCase
{
    abstract protected function getRateLimiter($limit, $window);

    /**
     * @test
     */
    public function it_provides_limit()
    {
        $rateLimiter = $this->getRateLimiter(5, 3600);

        $this->assertEquals(5, $rateLimiter->getLimit());
    }

    /**
     * @test
     */
    public function it_provides_window()
    {
        $rateLimiter = $this->getRateLimiter(5, 3600);

        $this->assertEquals(3600, $rateLimiter->getWindow());
    }

    /**
     * @test
     */
    public function it_decreases_number_of_remaining_attempts_on_hit()
    {
        $rateLimiter = $this->getRateLimiter(5, 3600);

        $rateLimiter->hit('test');

        $this->assertEquals(4, $rateLimiter->getRemainingAttempts('test'));
    }

    /**
     * @test
     */
    public function it_raises_exception_when_limit_is_reached()
    {
        $rateLimiter = $this->getRateLimiter(1, 3600);

        $rateLimiter->hit('test');

        try {
            $rateLimiter->hit('test');

            $this->fail('Limit should be exceeded');
        } catch (\Exception $ex) {
            $this->assertInstanceOf(RateLimitExceededException::class, $ex);
            /* @var $ex RateLimitExceededException */
            $this->assertEquals('test', $ex->getKey());
        }
    }

    /**
     * @test
     */
    public function it_resets_rate_limit_after_time_window_passes()
    {
        $rateLimiter = $this->getRateLimiter(1, 1);

        $rateLimiter->hit('test');

        try {
            $rateLimiter->hit('test');

            $this->fail('Limit should be exceeded');
        } catch (RateLimitExceededException $ex) {
        }

        sleep(2);

        $rateLimiter->hit('test');

        $this->assertEquals(0, $rateLimiter->getRemainingAttempts('test'));
    }

    /**
     * @test
     */
    public function it_provides_reset_at()
    {
        $rateLimiter = $this->getRateLimiter(5, 3600);

        $rateLimiter->hit('test');

        $this->assertGreaterThan(0, $rateLimiter->getResetAt('test'));
    }

    /**
     * @test
     */
    public function it_provides_reset_at_if_key_has_no_hits()
    {
        $rateLimiter = $this->getRateLimiter(5, 3600);

        $this->assertGreaterThan(0, $rateLimiter->getResetAt('test'));
    }
}
