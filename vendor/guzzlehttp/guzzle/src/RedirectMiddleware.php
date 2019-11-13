<?php
namespace GuzzleHttp;

use GuzzleHttp\Exception\BadResponseException;
use GuzzleHttp\Exception\TooManyRedirectsException;
use GuzzleHttp\Promise\PromiseInterface;
use GuzzleHttp\Psr7;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\UriInterface;

/**
 * Request redirect middleware.
 *
 * Apply this middleware like other middleware using
 * {@see GuzzleHttp\Middleware::redirect()}.
 */
class RedirectMiddleware
{
    const HISTORY_HEADER = 'X-Guzzle-Redirect-History';

    const STATUS_HISTORY_HEADER = 'X-Guzzle-Redirect-Status-History';

    public static $defaultSettings = [
        'max'             => 5,
        'protocols'       => ['http', 'https'],
        'strict'          => false,
        'referer'         => false,
        'track_redirects' => false,
    ];

    /** @var callable  */
    private $nextHandler;

    /**
     * @param callable $nextHandler Next handler to invoke.
     */
    public function __construct(callable $nextHandler)
    {
        $this->nextHandler = $nextHandler;
    }

    /**
     * @param RequestInterface $request
     * @param array            $options
     *
     * @return PromiseInterface
     */
    public function __invoke(RequestInterface $request, array $options)
    {
        $fn = $this->nextHandler;

        if (empty($options['allow_redirects'])) {
            return $fn($request, $options);
        }

        if ($options['allow_redirects'] === true) {
            $options['allow_redirects'] = self::$defaultSettings;
        } elseif (!is_array($options['allow_redirects'])) {
            throw new \InvalidArgumentException('allow_redirects must be true, false, or array');
        } else {
            // Merge the default settings with the provided settings
            $options['allow_redirects'] += self::$defaultSettings;
        }

        if (empty($options['allow_redirects']['max'])) {
            return $fn($request, $options);
        }

        return $fn($request, $options)
            ->then(function (ResponseInterface $response) use ($request, $options) {
                return $this->checkRedirect($request, $options, $response);
            });
    }

    /**
     * @param RequestInterface  $request
     * @param array             $options
     * @param ResponseInterface|PromiseInterface $response
     *
     * @return ResponseInterface|PromiseInterface
     */
    public function checkRedirect(
        RequestInterface $request,
        array $options,
        ResponseInterface $response
    ) {
        if (substr($response->getStatusCode(), 0, 1) != '3'
            || !$response->hasHeader('Location')
        ) {
            return $response;
        }

        $this->guardMax($request, $options);
        $nextRequest = $this->modifyRequest($request, $options, $response);

        if (isset($options['allow_redirects']['on_redirect'])) {
            call_user_func(
                $options['allow_redirects']['on_redirect'],
                $request,
                $response,
                $nextRequest->getUri()
            );
        }

        /** @var PromiseInterface|ResponseInterface $promise */
        $promise = $this($nextRequest, $options);

        // Add headers to be able to track history of redirects.
        if (!empty($options['allow_redirects']['track_redirects'])) {
            return $this->withTracking(
                $promise,
                (string) $nextRequest->getUri(),
                $response->getStatusCode()
            );
        }

        return $promise;
    }

    private function withTracking(PromiseInterface $promise, $uri, $statusCode)
    {
        return $promise->then(
            function (ResponseInterface $response) use ($uri, $statusCode) {
                // Note that we are pushing to the front of the list as this
                // would be an earlier response than what is currently present
                // in the history header.
                $historyHeader = $response->getHeader(self::HISTORY_HEADER);
                $statusHeader = $response->getHeader(self::STATUS_HISTORY_HEADER);
                array_unshift($historyHeader, $uri);
                array_unshift($statusHeader, $statusCode);
                return $response->withHeader(self::HISTORY_HEADER, $historyHeader)
                                ->withHeader(self::STATUS_HISTORY_HEADER, $statusHeader);
            }
        );
    }

    private function guardMax(RequestInterface $request, array &$options)
    {
        $current = isset($options['__redirect_count'])
            ? $options['__redirect_count']
            : 0;
        $options['__redirect_count'] = $current + 1;
        $max = $options['allow_redirects']['max'];

        if ($options['__redirect_count'] > $max) {
            throw new TooManyRedirectsException(
                "Will not follow more than {$max} redirects",
                $request
            );
        }
    }

    /**
     * @param RequestInterface  $request
     * @param array             $options
     * @param ResponseInterface $response
     *
     * @return RequestInterface
     */
    public function modifyRequest(
        RequestInterface $request,
        array $options,
        ResponseInterface $response
    ) {
        // Request modifications to apply.
        $modify = [];
        $protocols = $options['allow_redirects']['protocols'];

        // Use a GET request if this is an entity enclosing request and we are
        // not forcing RFC compliance, but rather emulating what all browsers
        // would do.
        $statusCode = $response->getStatusCode();
        if ($statusCode == 303 ||
            ($statusCode <= 302 && $request->getBody() && !$options['allow_redirects']['strict'])
        ) {
            $modify['method'] = 'GET';
            $modify['body'] = '';
        }

        $modify['uri'] = $this->redirectUri($request, $response, $protocols);
        Psr7\rewind_body($request);

        // Add the Referer header if it is told to do so and only
        // add the header if we are not redirecting from https to http.
        if ($options['allow_redirects']['referer']
            && $modify['uri']->getScheme() === $request->getUri()->getScheme()
        ) {
            $uri = $request->getUri()->withUserInfo('');
            $modify['set_headers']['Referer'] = (string) $uri;
        } else {
            $modify['remove_headers'][] = 'Referer';
        }

        // Remove Authorization header if host is different.
        if ($request->getUri()->getHost() !== $modify['uri']->getHost()) {
            $modify['remove_headers'][] = 'Authorization';
        }

        return Psr7\modify_request($request, $modify);
    }

    /**
     * Set the appropriate URL on the request based on the location header
     *
     * @param RequestInterface  $request
     * @param ResponseInterface $response
     * @param array             $protocols
     *
     * @return UriInterface
     */
    private function redirectUri(
        RequestInterface $request,
        ResponseInterface $response,
        array $protocols
    ) {
        $location = Psr7\UriResolver::resolve(
            $request->getUri(),
            new Psr7\Uri($response->getHeaderLine('Location'))
        );

        // Ensure that the redirect URI is allowed based on the protocols.
        if (!in_array($location->getScheme(), $protocols)) {
            throw new BadResponseException(
                sprintf(
                    'Redirect URI, %s, does not use one of the allowed redirect protocols: %s',
                    $location,
                    implode(', ', $protocols)
                ),
                $request,
                $response
            );
        }

        return $location;
    }
}
