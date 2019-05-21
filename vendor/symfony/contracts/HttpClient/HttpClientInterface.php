<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Contracts\HttpClient;

use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;
use Symfony\Contracts\HttpClient\Test\HttpClientTestCase;

/**
 * Provides flexible methods for requesting HTTP resources synchronously or asynchronously.
 *
 * @see HttpClientTestCase for a reference test suite
 *
 * @author Nicolas Grekas <p@tchwork.com>
 *
 * @experimental in 1.1
 */
interface HttpClientInterface
{
    public const OPTIONS_DEFAULTS = [
        'auth_basic' => null,   // array|string - an array containing the username as first value, and optionally the
                                //   password as the second one; or string like username:password - enabling HTTP Basic
                                //   authentication (RFC 7617)
        'auth_bearer' => null,  // string - a token enabling HTTP Bearer authorization (RFC 6750)
        'query' => [],          // string[] - associative array of query string values to merge with the request's URL
        'headers' => [],        // iterable|string[]|string[][] - headers names provided as keys or as part of values
        'body' => '',           // array|string|resource|\Traversable|\Closure - the callback SHOULD yield a string
                                //   smaller than the amount requested as argument; the empty string signals EOF; when
                                //   an array is passed, it is meant as a form payload of field names and values
        'json' => null,         // array|\JsonSerializable - when set, implementations MUST set the "body" option to
                                //   the JSON-encoded value and set the "content-type" headers to a JSON-compatible
                                //   value if they are not defined - typically "application/json"
        'user_data' => null,    // mixed - any extra data to attach to the request (scalar, callable, object...) that
                                //   MUST be available via $response->getInfo('user_data') - not used internally
        'max_redirects' => 20,  // int - the maximum number of redirects to follow; a value lower or equal to 0 means
                                //   redirects should not be followed; "Authorization" and "Cookie" headers MUST
                                //   NOT follow except for the initial host name
        'http_version' => null, // string - defaults to the best supported version, typically 1.1 or 2.0
        'base_uri' => null,     // string - the URI to resolve relative URLs, following rules in RFC 3986, section 2
        'buffer' => true,       // bool - whether the content of the response should be buffered or not
        'on_progress' => null,  // callable(int $dlNow, int $dlSize, array $info) - throwing any exceptions MUST abort
                                //   the request; it MUST be called on DNS resolution, on arrival of headers and on
                                //   completion; it SHOULD be called on upload/download of data and at least 1/s
        'resolve' => [],        // string[] - a map of host to IP address that SHOULD replace DNS resolution
        'proxy' => null,        // string - by default, the proxy-related env vars handled by curl SHOULD be honored
        'no_proxy' => null,     // string - a comma separated list of hosts that do not require a proxy to be reached
        'timeout' => null,      // float - the inactivity timeout - defaults to ini_get('default_socket_timeout')
        'bindto' => '0',        // string - the interface or the local socket to bind to
        'verify_peer' => true,  // see https://php.net/context.ssl for the following options
        'verify_host' => true,
        'cafile' => null,
        'capath' => null,
        'local_cert' => null,
        'local_pk' => null,
        'passphrase' => null,
        'ciphers' => null,
        'peer_fingerprint' => null,
        'capture_peer_cert_chain' => false,
        'extra' => [],          // array - additional options that can be ignored if unsupported, unlike regular options
    ];

    /**
     * Requests an HTTP resource.
     *
     * Responses MUST be lazy, but their status code MUST be
     * checked even if none of their public methods are called.
     *
     * Implementations are not required to support all options described above; they can also
     * support more custom options; but in any case, they MUST throw a TransportExceptionInterface
     * when an unsupported option is passed.
     *
     * @throws TransportExceptionInterface When an unsupported option is passed
     */
    public function request(string $method, string $url, array $options = []): ResponseInterface;

    /**
     * Yields responses chunk by chunk as they complete.
     *
     * @param ResponseInterface|ResponseInterface[]|iterable $responses One or more responses created by the current HTTP client
     * @param float|null                                     $timeout   The inactivity timeout before exiting the iterator
     */
    public function stream($responses, float $timeout = null): ResponseStreamInterface;
}
