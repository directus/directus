<?php
/**
 * This file is part of the Rate Limit package.
 *
 * Copyright (c) Nikola Posa
 *
 * For full copyright and license information, please refer to the LICENSE file,
 * located at the package root folder.
 */

namespace RateLimit\Middleware;

use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;

/**
 * @author Nikola Posa <posa.nikola@gmail.com>
 */
class Options
{
    /**
     * @var callable
     */
    protected $whitelist;

    /**
     * @var callable
     */
    protected $limitExceededHandler;

    public function __construct(callable $whitelist, callable $limitExceededHandler)
    {
        $this->whitelist = $whitelist;
        $this->limitExceededHandler = $limitExceededHandler;
    }

    public static function fromArray(array $options)
    {
        $options = array_merge(self::getDefaultOptions(), $options);

        return new self(
            $options['whitelist'],
            $options['limitExceededHandler']
        );
    }

    public function getWhitelist()
    {
        return $this->whitelist;
    }

    public function getLimitExceededHandler()
    {
        return $this->limitExceededHandler;
    }

    private static function getDefaultOptions()
    {
        return [
            'whitelist' => function (RequestInterface $request) {
                return false;
            },
            'limitExceededHandler' => function (RequestInterface $request, ResponseInterface $response) {
                return $response;
            },
        ];
    }
}
