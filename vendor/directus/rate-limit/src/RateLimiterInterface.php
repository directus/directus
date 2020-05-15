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

use RateLimit\Exception\RateLimitExceededException;

/**
 * @author Nikola Posa <posa.nikola@gmail.com>
 */
interface RateLimiterInterface
{
    /**
     * @return int
     */
    public function getLimit();

    /**
     * @return int
     */
    public function getWindow();

    /**
     * @param string $key
     *
     * @throws RateLimitExceededException
     *
     * @return void
     */
    public function hit($key);

    /**
     * @param string $key
     *
     * @return int
     */
    public function getRemainingAttempts($key);

    /**
     * @param string $key
     *
     * @return int Timestamp in the future
     */
    public function getResetAt($key);
}
