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

use RateLimit\Exception\RateLimitExceededException;
use RateLimit\RateLimiterInterface;
use RateLimit\Middleware\Identity\IdentityResolverInterface;
use RateLimit\Middleware\Identity\IpAddressIdentityResolver;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;

/**
 * @author Nikola Posa <posa.nikola@gmail.com>
 */
final class RateLimitMiddleware
{
    const LIMIT_EXCEEDED_HTTP_STATUS_CODE = 429; //HTTP 429 "Too Many Requests" (RFC 6585)

    const HEADER_LIMIT = 'X-RateLimit-Limit';
    const HEADER_REMAINING = 'X-RateLimit-Remaining';
    const HEADER_RESET = 'X-RateLimit-Reset';

    /**
     * @var RateLimiterInterface
     */
    private $rateLimiter;

    /**
     * @var IdentityResolverInterface
     */
    private $identityResolver;

    /**
     * @var Options
     */
    private $options;

    /**
     * @var string
     */
    private $identity;

    public function __construct(RateLimiterInterface $rateLimiter, IdentityResolverInterface $identityResolver, Options $options)
    {
        $this->rateLimiter = $rateLimiter;
        $this->identityResolver = $identityResolver;
        $this->options = $options;
    }

    public static function createDefault(RateLimiterInterface $rateLimiter, array $options = [])
    {
        return new self(
            $rateLimiter,
            new IpAddressIdentityResolver(),
            Options::fromArray($options)
        );
    }

    /**
     * {@inheritdoc}
     */
    public function __invoke(RequestInterface $request, ResponseInterface $response, callable $out = null)
    {
        return $this->process($request, $response, $out);
    }

    public function process(RequestInterface $request, ResponseInterface $response, callable $out = null)
    {
        if ($this->isWhitelisted($request)) {
            return $this->next($request, $response, $out);
        }

        $this->identity = $this->resolveIdentity($request);

        try {
            $this->rateLimiter->hit($this->identity);

            return $this->onBelowLimit($request, $response, $out);
        } catch (RateLimitExceededException $ex) {
            return $this->onLimitExceeded($request, $response);
        }
    }

    private function isWhitelisted(RequestInterface $request)
    {
        $whitelist = $this->options->getWhitelist();

        return $whitelist($request);
    }

    private function resolveIdentity(RequestInterface $request)
    {
        return $this->identityResolver->getIdentity($request);
    }

    private function onLimitExceeded(RequestInterface $request, ResponseInterface $response)
    {
        $response = $this
            ->setRateLimitHeaders($response)
            ->withStatus(self::LIMIT_EXCEEDED_HTTP_STATUS_CODE)
        ;

        $limitExceededHandler = $this->options->getLimitExceededHandler();
        $response = $limitExceededHandler($request, $response);

        return $response;
    }

    private function onBelowLimit(RequestInterface $request, ResponseInterface $response, callable $out = null)
    {
        $response = $this->setRateLimitHeaders($response);

        return $this->next($request, $response, $out);
    }

    private function next(RequestInterface $request, ResponseInterface $response, callable $out = null)
    {
        return $out ? $out($request, $response) : $response;
    }

    private function setRateLimitHeaders(ResponseInterface $response)
    {
        return $response
            ->withHeader(self::HEADER_LIMIT, (string) $this->rateLimiter->getLimit())
            ->withHeader(self::HEADER_REMAINING, (string) $this->rateLimiter->getRemainingAttempts($this->identity))
            ->withHeader(self::HEADER_RESET, (string) $this->rateLimiter->getResetAt($this->identity))
        ;
    }
}
