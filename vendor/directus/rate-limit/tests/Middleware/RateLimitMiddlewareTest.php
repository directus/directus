<?php
/**
 * This file is part of the Rate Limit package.
 *
 * Copyright (c) Nikola Posa
 *
 * For full copyright and license information, please refer to the LICENSE file,
 * located at the package root folder.
 */

namespace RateLimit\Tests\Middleware;

use PHPUnit_Framework_TestCase;
use RateLimit\Middleware\RateLimitMiddleware;
use RateLimit\RateLimiterFactory;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;
use Zend\Diactoros\Request;
use Zend\Diactoros\Response;
use Zend\Diactoros\Response\JsonResponse;

/**
 * @author Nikola Posa <posa.nikola@gmail.com>
 */
class RateLimitMiddlewareTest extends PHPUnit_Framework_TestCase
{
    /**
     * @test
     */
    public function it_sets_rate_limit_headers()
    {
        $rateLimitMiddleware = RateLimitMiddleware::createDefault(
            RateLimiterFactory::createInMemoryRateLimiter(5, 3600)
        );

        /* @var $response ResponseInterface */
        $response = $rateLimitMiddleware(new Request(), new Response());

        $this->assertEquals('5', $response->getHeaderLine(RateLimitMiddleware::HEADER_LIMIT));
        $this->assertEquals('4', $response->getHeaderLine(RateLimitMiddleware::HEADER_REMAINING));
        $this->assertTrue($response->hasHeader(RateLimitMiddleware::HEADER_RESET));
    }

    /**
     * @test
     */
    public function it_sets_appropriate_response_status_when_limit_is_reached()
    {
        $rateLimitMiddleware = RateLimitMiddleware::createDefault(
            RateLimiterFactory::createInMemoryRateLimiter(1, 3600)
        );

        $rateLimitMiddleware(new Request(), new Response());

        /* @var $response ResponseInterface */
        $response = $rateLimitMiddleware(new Request(), new Response());

        $this->assertEquals(RateLimitMiddleware::LIMIT_EXCEEDED_HTTP_STATUS_CODE, $response->getStatusCode());
    }

    /**
     * @test
     */
    public function it_does_not_alter_status_code_when_below_the_limit()
    {
        $rateLimitMiddleware = RateLimitMiddleware::createDefault(
            RateLimiterFactory::createInMemoryRateLimiter(5, 3600)
        );

        /* @var $response ResponseInterface */
        $response = $rateLimitMiddleware(new Request(), new Response('php://memory', 200));

        $this->assertEquals(200, $response->getStatusCode());
    }

    /**
     * @test
     */
    public function it_decrements_remaining_header()
    {
        $rateLimitMiddleware = RateLimitMiddleware::createDefault(
            RateLimiterFactory::createInMemoryRateLimiter(5, 3600)
        );

        /* @var $response ResponseInterface */
        $response = $rateLimitMiddleware(new Request(), new Response());

        $this->assertEquals('4', $response->getHeaderLine(RateLimitMiddleware::HEADER_REMAINING));

        /* @var $response ResponseInterface */
        $response = $rateLimitMiddleware(new Request(), new Response());

        $this->assertEquals('3', $response->getHeaderLine(RateLimitMiddleware::HEADER_REMAINING));
    }

    /**
     * @test
     */
    public function it_resets_rate_limit_after_time_window_passes()
    {
        $rateLimitMiddleware = RateLimitMiddleware::createDefault(
            RateLimiterFactory::createInMemoryRateLimiter(1, 1)
        );

        /* @var $response ResponseInterface */
        $response = $rateLimitMiddleware(new Request(), new Response());

        $this->assertEquals('0', $response->getHeaderLine(RateLimitMiddleware::HEADER_REMAINING));

        /* @var $response ResponseInterface */
        $response = $rateLimitMiddleware(new Request(), new Response());

        $this->assertEquals(RateLimitMiddleware::LIMIT_EXCEEDED_HTTP_STATUS_CODE, $response->getStatusCode());

        sleep(2);

        /* @var $response ResponseInterface */
        $response = $rateLimitMiddleware(new Request(), new Response());

        $this->assertEquals(200, $response->getStatusCode());
    }

    /**
     * @test
     */
    public function it_invokes_limit_exceeded_handler_supplied_through_options()
    {
        $rateLimitMiddleware = RateLimitMiddleware::createDefault(
            RateLimiterFactory::createInMemoryRateLimiter(1, 3600),
            [
                'limitExceededHandler' => function (RequestInterface $request, ResponseInterface $response) {
                    return new JsonResponse(['message' => 'Too many requests'], $response->getStatusCode());
                }
            ]
        );

        $rateLimitMiddleware(new Request(), new Response());

        /* @var $response JsonResponse */
        $response = $rateLimitMiddleware(new Request(), new Response());

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(RateLimitMiddleware::LIMIT_EXCEEDED_HTTP_STATUS_CODE, $response->getStatusCode());
        $this->assertContains('Too many requests', $response->getBody()->getContents());
    }

    /**
     * @test
     */
    public function it_provides_option_to_whitelist_requests()
    {
        $rateLimitMiddleware = RateLimitMiddleware::createDefault(
            RateLimiterFactory::createInMemoryRateLimiter(1, 3600),
            [
                'whitelist' => function (RequestInterface $request) {
                    return true;
                },
            ]
        );

        $rateLimitMiddleware(new Request(), new Response('php://memory', 200));

        $rateLimitMiddleware(new Request(), new Response('php://memory', 200));

        /* @var $response ResponseInterface */
        $response = $rateLimitMiddleware(new Request(), new Response('php://memory', 200));

        $this->assertEquals(200, $response->getStatusCode());
    }
}
