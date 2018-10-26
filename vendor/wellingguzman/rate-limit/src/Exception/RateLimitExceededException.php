<?php
/**
 * This file is part of the Rate Limit package.
 *
 * Copyright (c) Nikola Posa
 *
 * For full copyright and license information, please refer to the LICENSE file,
 * located at the package root folder.
 */

namespace RateLimit\Exception;

use RuntimeException;

/**
 * @author Nikola Posa <posa.nikola@gmail.com>
 */
class RateLimitExceededException extends RuntimeException implements ExceptionInterface
{
    /**
     * @var string
     */
    protected $key;

    public static function forKey($key)
    {
        $exception = new static('Rate limit exceeded');

        $exception->key = $key;

        return $exception;
    }

    public function getKey()
    {
        return $this->key;
    }
}
