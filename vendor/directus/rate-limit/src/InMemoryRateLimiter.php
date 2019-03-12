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

/**
 * @author Nikola Posa <posa.nikola@gmail.com>
 */
final class InMemoryRateLimiter extends AbstractRateLimiter
{
    /**
     * @var array
     */
    protected $store = [];

    protected function get($key, $default)
    {
        if (
            !$this->has($key)
            || $this->hasExpired($key)
        ) {
            return $default;
        }

        return $this->store[$key]['current'];
    }

    protected function init($key)
    {
        $this->store[(string)$key] = [
            'current' => 1,
            'expires' => time() + $this->window,
        ];
    }

    protected function increment($key)
    {
        $this->store[(string)$key]['current']++;
    }

    protected function ttl($key)
    {
        $key = (string)$key;
        if (!isset($this->store[$key])) {
            return 0;
        }

        return max($this->store[$key]['expires'] - time(), 0);
    }

    private function has($key)
    {
        return array_key_exists((string)$key, $this->store);
    }

    private function hasExpired($key)
    {
        return time() > $this->store[(string)$key]['expires'];
    }
}
