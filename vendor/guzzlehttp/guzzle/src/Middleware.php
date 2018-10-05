<?php
namespace GuzzleHttp;

use GuzzleHttp\Cookie\CookieJarInterface;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Promise\RejectedPromise;
use GuzzleHttp\Psr7;
use Psr\Http\Message\ResponseInterface;
use Psr\Log\LoggerInterface;
use Psr\Log\LogLevel;

/**
 * Functions used to create and wrap handlers with handler middleware.
 */
final class Middleware
{
    /**
     * Middleware that adds cookies to requests.
     *
     * The options array must be set to a CookieJarInterface in order to use
     * cookies. This is typically handled for you by a client.
     *
     * @return callable Returns a function that accepts the next handler.
     */
    public static function cookies()
    {
        return function (callable $handler) {
            return function ($request, array $options) use ($handler) {
                if (empty($options['cookies'])) {
                    return $handler($request, $options);
                } elseif (!($options['cookies'] instanceof CookieJarInterface)) {
                    throw new \InvalidArgumentException('cookies must be an instance of GuzzleHttp\Cookie\CookieJarInterface');
                }
                $cookieJar = $options['cookies'];
                $request = $cookieJar->withCookieHeader($request);
                return $handler($request, $options)
                    ->then(
                        function ($response) use ($cookieJar, $request) {
                            $cookieJar->extractCookies($request, $response);
                            return $response;
                        }
                );
            };
        };
    }

    /**
     * Middleware that throws exceptions for 4xx or 5xx responses when the
     * "http_error" request option is set to true.
     *
     * @return callable Returns a function that accepts the next handler.
     */
    public static function httpErrors()
    {
        return function (callable $handler) {
            return function ($request, array $options) use ($handler) {
                if (empty($options['http_errors'])) {
                    return $handler($request, $options);
                }
                return $handler($request, $options)->then(
                    function (ResponseInterface $response) use ($request, $handler) {
                        $code = $response->getStatusCode();
                        if ($code < 400) {
                            return $response;
                        }
                        throw RequestException::create($request, $response);
                    }
                );
            };
        };
    }

    /**
     * Middleware that pushes history data to an ArrayAccess container.
     *
     * @param array|\ArrayAccess $container Container to hold the history (by reference).
     *
     * @return callable Returns a function that accepts the next handler.
     * @throws \InvalidArgumentException if container is not an array or ArrayAccess.
     */
    public static function history(&$container)
    {
        if (!is_array($container) && !$container instanceof \ArrayAccess) {
            throw new \InvalidArgumentException('history container must be an array or object implementing ArrayAccess');
        }

        return function (callable $handler) use (&$container) {
            return function ($request, array $options) use ($handler, &$container) {
                return $handler($request, $options)->then(
                    function ($value) use ($request, &$container, $options) {
                        $container[] = [
                            'request'  => $request,
                            'response' => $value,
                            'error'    => null,
                            'options'  => $options
                        ];
                        return $value;
                    },
                    function ($reason) use ($request, &$container, $options) {
                        $container[] = [
                            'request'  => $request,
                            'response' => null,
                            'error'    => $reason,
                            'options'  => $options
                        ];
                        return \GuzzleHttp\Promise\rejection_for($reason);
                    }
                );
            };
        };
    }

    /**
     * Middleware that invokes a callback before and after sending a request.
     *
     * The provided listener cannot modify or alter the response. It simply
     * "taps" into the chain to be notified before returning the promise. The
     * before listener accepts a request and options array, and the after
     * listener accepts a request, options array, and response promise.
     *
     * @param callable $before Function to invoke before forwarding the request.
     * @param callable $after  Function invoked after forwarding.
     *
     * @return callable Returns a function that accepts the next handler.
     */
    public static function tap(callable $before = null, callable $after = null)
    {
        return function (callable $handler) use ($before, $after) {
            return function ($request, array $options) use ($handler, $before, $after) {
                if ($before) {
                    $before($request, $options);
                }
                $response = $handler($request, $options);
                if ($after) {
                    $after($request, $options, $response);
                }
                return $response;
            };
        };
    }

    /**
     * Middleware that handles request redirects.
     *
     * @return callable Returns a function that accepts the next handler.
     */
    public static function redirect()
    {
        return function (callable $handler) {
            return new RedirectMiddleware($handler);
        };
    }

    /**
     * Middleware that retries requests based on the boolean result of
     * invoking the provided "decider" function.
     *
     * If no delay function is provided, a simple implementation of exponential
     * backoff will be utilized.
     *
     * @param callable $decider Function that accepts the number of retries,
     *                          a request, [response], and [exception] and
     *                          returns true if the request is to be retried.
     * @param callable $delay   Function that accepts the number of retries and
     *                          returns the number of milliseconds to delay.
     *
     * @return callable Returns a function that accepts the next handler.
     */
    public static function retry(callable $decider, callable $delay = null)
    {
        return function (callable $handler) use ($decider, $delay) {
            return new RetryMiddleware($decider, $handler, $delay);
        };
    }

    /**
     * Middleware that logs requests, responses, and errors using a message
     * formatter.
     *
     * @param LoggerInterface  $logger Logs messages.
     * @param MessageFormatter $formatter Formatter used to create message strings.
     * @param string           $logLevel Level at which to log requests.
     *
     * @return callable Returns a function that accepts the next handler.
     */
    public static function log(LoggerInterface $logger, MessageFormatter $formatter, $logLevel = LogLevel::INFO)
    {
        return function (callable $handler) use ($logger, $formatter, $logLevel) {
            return function ($request, array $options) use ($handler, $logger, $formatter, $logLevel) {
                return $handler($request, $options)->then(
                    function ($response) use ($logger, $request, $formatter, $logLevel) {
                        $message = $formatter->format($request, $response);
                        $logger->log($logLevel, $message);
                        return $response;
                    },
                    function ($reason) use ($logger, $request, $formatter) {
                        $response = $reason instanceof RequestException
                            ? $reason->getResponse()
                            : null;
                        $message = $formatter->format($request, $response, $reason);
                        $logger->notice($message);
                        return \GuzzleHttp\Promise\rejection_for($reason);
                    }
                );
            };
        };
    }

    /**
     * This middleware adds a default content-type if possible, a default
     * content-length or transfer-encoding header, and the expect header.
     *
     * @return callable
     */
    public static function prepareBody()
    {
        return function (callable $handler) {
            return new PrepareBodyMiddleware($handler);
        };
    }

    /**
     * Middleware that applies a map function to the request before passing to
     * the next handler.
     *
     * @param callable $fn Function that accepts a RequestInterface and returns
     *                     a RequestInterface.
     * @return callable
     */
    public static function mapRequest(callable $fn)
    {
        return function (callable $handler) use ($fn) {
            return function ($request, array $options) use ($handler, $fn) {
                return $handler($fn($request), $options);
            };
        };
    }

    /**
     * Middleware that applies a map function to the resolved promise's
     * response.
     *
     * @param callable $fn Function that accepts a ResponseInterface and
     *                     returns a ResponseInterface.
     * @return callable
     */
    public static function mapResponse(callable $fn)
    {
        return function (callable $handler) use ($fn) {
            return function ($request, array $options) use ($handler, $fn) {
                return $handler($request, $options)->then($fn);
            };
        };
    }
}
