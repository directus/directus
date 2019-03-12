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
use RateLimit\InMemoryRateLimiter;

/**
 * @author Nikola Posa <posa.nikola@gmail.com>
 */
class InMemoryRateLimiterTest extends RateLimiterTest
{
    protected function getRateLimiter($limit, $window)
    {
        return new InMemoryRateLimiter($limit, $window);
    }
}
