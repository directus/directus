<?php
/**
 * This file is part of the league/oauth2-client library
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 *
 * @copyright Copyright (c) Alex Bilbie <hello@alexbilbie.com>
 * @license http://opensource.org/licenses/MIT MIT
 * @link http://thephpleague.com/oauth2-client/ Documentation
 * @link https://packagist.org/packages/league/oauth2-client Packagist
 * @link https://github.com/thephpleague/oauth2-client GitHub
 */

namespace League\OAuth2\Client\Tool;

use GuzzleHttp\Psr7\Request;

/**
 * Used to produce PSR-7 Request instances.
 *
 * @link https://github.com/guzzle/guzzle/pull/1101
 */
class RequestFactory
{
    /**
     * Creates a PSR-7 Request instance.
     *
     * @param  null|string $method HTTP method for the request.
     * @param  null|string $uri URI for the request.
     * @param  array $headers Headers for the message.
     * @param  string|resource|StreamInterface $body Message body.
     * @param  string $version HTTP protocol version.
     *
     * @return Request
     */
    public function getRequest(
        $method,
        $uri,
        array $headers = [],
        $body = null,
        $version = '1.1'
    ) {
        return new Request($method, $uri, $headers, $body, $version);
    }

    /**
     * Parses simplified options.
     *
     * @param array $options Simplified options.
     *
     * @return array Extended options for use with getRequest.
     */
    protected function parseOptions(array $options)
    {
        // Should match default values for getRequest
        $defaults = [
            'headers' => [],
            'body'    => null,
            'version' => '1.1',
        ];

        return array_merge($defaults, $options);
    }

    /**
     * Creates a request using a simplified array of options.
     *
     * @param  null|string $method
     * @param  null|string $uri
     * @param  array $options
     *
     * @return Request
     */
    public function getRequestWithOptions($method, $uri, array $options = [])
    {
        $options = $this->parseOptions($options);

        return $this->getRequest(
            $method,
            $uri,
            $options['headers'],
            $options['body'],
            $options['version']
        );
    }
}
