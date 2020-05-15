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
abstract class AbstractRateLimiter implements RateLimiterInterface
{
    /**
     * @var int
     */
    protected $limit;

    /**
     * @var int
     */
    protected $window;

    /**
     * @var string
     */
    protected $key;

    public function __construct($limit, $window)
    {
        $this->limit = (int)$limit;
        $this->window = (int)$window;
    }

    /**
     * {@inheritdoc}
     */
    public function getLimit()
    {
        return $this->limit;
    }

    /**
     * {@inheritdoc}
     */
    public function getWindow()
    {
        return $this->window;
    }

    /**
     * {@inheritdoc}
     */
    public function hit($key)
    {
        $key = (string)$key;
        $current = $this->getCurrent($key);

        if ($current >= $this->limit) {
            throw RateLimitExceededException::forKey($key);
        }

        if (0 === $current) {
            $this->init($key);
            return;
        }

        $this->increment($key);
    }

    /**
     * {@inheritdoc}
     */
    public function getRemainingAttempts($key)
    {
        return max(0, $this->limit - $this->getCurrent((string)$key));
    }

    /**
     * {@inheritdoc}
     */
    public function getResetAt($key)
    {
        return time() + $this->ttl((string)$key);
    }

    protected function getCurrent($key)
    {
        return $this->get((string)$key, 0);
    }

    abstract protected function get($key, $default);

    abstract protected function init($key);

    abstract protected function increment($key);

    abstract protected function ttl($key);
}
