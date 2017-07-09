<?php
/**
 * Slim - a micro PHP 5 framework
 *
 * @author      Josh Lockhart <info@slimframework.com>
 * @copyright   2011 Josh Lockhart
 * @link        http://www.slimframework.com
 * @license     http://www.slimframework.com/license
 * @version     2.6.1
 * @package     Slim
 *
 * MIT LICENSE
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
namespace Slim\Http;

/**
 * Response
 *
 * This is a simple abstraction over top an HTTP response. This
 * provides methods to set the HTTP status, the HTTP headers,
 * and the HTTP body.
 *
 * @package Slim
 * @author  Josh Lockhart
 * @since   1.0.0
 */
class Response implements \ArrayAccess, \Countable, \IteratorAggregate
{
    /**
     * @var int HTTP status code
     */
    protected $status;

    /**
     * @var \Slim\Http\Headers
     */
    public $headers;

    /**
     * @var \Slim\Http\Cookies
     */
    public $cookies;

    /**
     * @var string HTTP response body
     */
    protected $body;

    /**
     * @var int Length of HTTP response body
     */
    protected $length;

    /**
     * @var array HTTP response codes and messages
     */
    protected static $messages = array(
        //Informational 1xx
        100 => '100 Continue',
        101 => '101 Switching Protocols',
        //Successful 2xx
        200 => '200 OK',
        201 => '201 Created',
        202 => '202 Accepted',
        203 => '203 Non-Authoritative Information',
        204 => '204 No Content',
        205 => '205 Reset Content',
        206 => '206 Partial Content',
        226 => '226 IM Used',
        //Redirection 3xx
        300 => '300 Multiple Choices',
        301 => '301 Moved Permanently',
        302 => '302 Found',
        303 => '303 See Other',
        304 => '304 Not Modified',
        305 => '305 Use Proxy',
        306 => '306 (Unused)',
        307 => '307 Temporary Redirect',
        //Client Error 4xx
        400 => '400 Bad Request',
        401 => '401 Unauthorized',
        402 => '402 Payment Required',
        403 => '403 Forbidden',
        404 => '404 Not Found',
        405 => '405 Method Not Allowed',
        406 => '406 Not Acceptable',
        407 => '407 Proxy Authentication Required',
        408 => '408 Request Timeout',
        409 => '409 Conflict',
        410 => '410 Gone',
        411 => '411 Length Required',
        412 => '412 Precondition Failed',
        413 => '413 Request Entity Too Large',
        414 => '414 Request-URI Too Long',
        415 => '415 Unsupported Media Type',
        416 => '416 Requested Range Not Satisfiable',
        417 => '417 Expectation Failed',
        418 => '418 I\'m a teapot',
        422 => '422 Unprocessable Entity',
        423 => '423 Locked',
        426 => '426 Upgrade Required',
        428 => '428 Precondition Required',
        429 => '429 Too Many Requests',
        431 => '431 Request Header Fields Too Large',
        //Server Error 5xx
        500 => '500 Internal Server Error',
        501 => '501 Not Implemented',
        502 => '502 Bad Gateway',
        503 => '503 Service Unavailable',
        504 => '504 Gateway Timeout',
        505 => '505 HTTP Version Not Supported',
        506 => '506 Variant Also Negotiates',
        510 => '510 Not Extended',
        511 => '511 Network Authentication Required'
    );

    /**
     * Constructor
     * @param string                   $body   The HTTP response body
     * @param int                      $status The HTTP response status
     * @param \Slim\Http\Headers|array $headers The HTTP response headers
     */
    public function __construct($body = '', $status = 200, $headers = array())
    {
        $this->setStatus($status);
        $this->headers = new \Slim\Http\Headers(array('Content-Type' => 'text/html'));
        $this->headers->replace($headers);
        $this->cookies = new \Slim\Http\Cookies();
        $this->write($body);
    }

    public function getStatus()
    {
        return $this->status;
    }

    public function setStatus($status)
    {
        $this->status = (int)$status;
    }

    /**
     * DEPRECATION WARNING! Use `getStatus` or `setStatus` instead.
     *
     * Get and set status
     * @param  int|null $status
     * @return int
     */
    public function status($status = null)
    {
        if (!is_null($status)) {
            $this->status = (int) $status;
        }

        return $this->status;
    }

    /**
     * DEPRECATION WARNING! Access `headers` property directly.
     *
     * Get and set header
     * @param  string      $name  Header name
     * @param  string|null $value Header value
     * @return string      Header value
     */
    public function header($name, $value = null)
    {
        if (!is_null($value)) {
            $this->headers->set($name, $value);
        }

        return $this->headers->get($name);
    }

    /**
     * DEPRECATION WARNING! Access `headers` property directly.
     *
     * Get headers
     * @return \Slim\Http\Headers
     */
    public function headers()
    {
        return $this->headers;
    }

    public function getBody()
    {
        return $this->body;
    }

    public function setBody($content)
    {
        $this->write($content, true);
    }

    /**
     * DEPRECATION WARNING! use `getBody` or `setBody` instead.
     *
     * Get and set body
     * @param  string|null $body Content of HTTP response body
     * @return string
     */
    public function body($body = null)
    {
        if (!is_null($body)) {
            $this->write($body, true);
        }

        return $this->body;
    }

    /**
     * Append HTTP response body
     * @param  string   $body       Content to append to the current HTTP response body
     * @param  bool     $replace    Overwrite existing response body?
     * @return string               The updated HTTP response body
     */
    public function write($body, $replace = false)
    {
        if ($replace) {
            $this->body = $body;
        } else {
            $this->body .= (string)$body;
        }
        $this->length = strlen($this->body);

        return $this->body;
    }

    public function getLength()
    {
        return $this->length;
    }

    /**
     * DEPRECATION WARNING! Use `getLength` or `write` or `body` instead.
     *
     * Get and set length
     * @param  int|null $length
     * @return int
     */
    public function length($length = null)
    {
        if (!is_null($length)) {
            $this->length = (int) $length;
        }

        return $this->length;
    }

    /**
     * Finalize
     *
     * This prepares this response and returns an array
     * of [status, headers, body]. This array is passed to outer middleware
     * if available or directly to the Slim run method.
     *
     * @return array[int status, array headers, string body]
     */
    public function finalize()
    {
        // Prepare response
        if (in_array($this->status, array(204, 304))) {
            $this->headers->remove('Content-Type');
            $this->headers->remove('Content-Length');
            $this->setBody('');
        }

        return array($this->status, $this->headers, $this->body);
    }

    /**
     * DEPRECATION WARNING! Access `cookies` property directly.
     *
     * Set cookie
     *
     * Instead of using PHP's `setcookie()` function, Slim manually constructs the HTTP `Set-Cookie`
     * header on its own and delegates this responsibility to the `Slim_Http_Util` class. This
     * response's header is passed by reference to the utility class and is directly modified. By not
     * relying on PHP's native implementation, Slim allows middleware the opportunity to massage or
     * analyze the raw header before the response is ultimately delivered to the HTTP client.
     *
     * @param string        $name    The name of the cookie
     * @param string|array  $value   If string, the value of cookie; if array, properties for
     *                               cookie including: value, expire, path, domain, secure, httponly
     */
    public function setCookie($name, $value)
    {
        // Util::setCookieHeader($this->header, $name, $value);
        $this->cookies->set($name, $value);
    }

    /**
     * DEPRECATION WARNING! Access `cookies` property directly.
     *
     * Delete cookie
     *
     * Instead of using PHP's `setcookie()` function, Slim manually constructs the HTTP `Set-Cookie`
     * header on its own and delegates this responsibility to the `Slim_Http_Util` class. This
     * response's header is passed by reference to the utility class and is directly modified. By not
     * relying on PHP's native implementation, Slim allows middleware the opportunity to massage or
     * analyze the raw header before the response is ultimately delivered to the HTTP client.
     *
     * This method will set a cookie with the given name that has an expiration time in the past; this will
     * prompt the HTTP client to invalidate and remove the client-side cookie. Optionally, you may
     * also pass a key/value array as the second argument. If the "domain" key is present in this
     * array, only the Cookie with the given name AND domain will be removed. The invalidating cookie
     * sent with this response will adopt all properties of the second argument.
     *
     * @param string $name     The name of the cookie
     * @param array  $settings Properties for cookie including: value, expire, path, domain, secure, httponly
     */
    public function deleteCookie($name, $settings = array())
    {
        $this->cookies->remove($name, $settings);
        // Util::deleteCookieHeader($this->header, $name, $value);
    }

    /**
     * Redirect
     *
     * This method prepares this response to return an HTTP Redirect response
     * to the HTTP client.
     *
     * @param string $url    The redirect destination
     * @param int    $status The redirect HTTP status code
     */
    public function redirect ($url, $status = 302)
    {
        $this->setStatus($status);
        $this->headers->set('Location', $url);
    }

    /**
     * Helpers: Empty?
     * @return bool
     */
    public function isEmpty()
    {
        return in_array($this->status, array(201, 204, 304));
    }

    /**
     * Helpers: Informational?
     * @return bool
     */
    public function isInformational()
    {
        return $this->status >= 100 && $this->status < 200;
    }

    /**
     * Helpers: OK?
     * @return bool
     */
    public function isOk()
    {
        return $this->status === 200;
    }

    /**
     * Helpers: Successful?
     * @return bool
     */
    public function isSuccessful()
    {
        return $this->status >= 200 && $this->status < 300;
    }

    /**
     * Helpers: Redirect?
     * @return bool
     */
    public function isRedirect()
    {
        return in_array($this->status, array(301, 302, 303, 307));
    }

    /**
     * Helpers: Redirection?
     * @return bool
     */
    public function isRedirection()
    {
        return $this->status >= 300 && $this->status < 400;
    }

    /**
     * Helpers: Forbidden?
     * @return bool
     */
    public function isForbidden()
    {
        return $this->status === 403;
    }

    /**
     * Helpers: Not Found?
     * @return bool
     */
    public function isNotFound()
    {
        return $this->status === 404;
    }

    /**
     * Helpers: Client error?
     * @return bool
     */
    public function isClientError()
    {
        return $this->status >= 400 && $this->status < 500;
    }

    /**
     * Helpers: Server Error?
     * @return bool
     */
    public function isServerError()
    {
        return $this->status >= 500 && $this->status < 600;
    }

    /**
     * DEPRECATION WARNING! ArrayAccess interface will be removed from \Slim\Http\Response.
     * Iterate `headers` or `cookies` properties directly.
     */

    /**
     * Array Access: Offset Exists
     */
    public function offsetExists($offset)
    {
        return isset($this->headers[$offset]);
    }

    /**
     * Array Access: Offset Get
     */
    public function offsetGet($offset)
    {
        return $this->headers[$offset];
    }

    /**
     * Array Access: Offset Set
     */
    public function offsetSet($offset, $value)
    {
        $this->headers[$offset] = $value;
    }

    /**
     * Array Access: Offset Unset
     */
    public function offsetUnset($offset)
    {
        unset($this->headers[$offset]);
    }

    /**
     * DEPRECATION WARNING! Countable interface will be removed from \Slim\Http\Response.
     * Call `count` on `headers` or `cookies` properties directly.
     *
     * Countable: Count
     */
    public function count()
    {
        return count($this->headers);
    }

    /**
     * DEPRECATION WARNING! IteratorAggregate interface will be removed from \Slim\Http\Response.
     * Iterate `headers` or `cookies` properties directly.
     *
     * Get Iterator
     *
     * This returns the contained `\Slim\Http\Headers` instance which
     * is itself iterable.
     *
     * @return \Slim\Http\Headers
     */
    public function getIterator()
    {
        return $this->headers->getIterator();
    }

    /**
     * Get message for HTTP status code
     * @param  int         $status
     * @return string|null
     */
    public static function getMessageForCode($status)
    {
        if (isset(self::$messages[$status])) {
            return self::$messages[$status];
        } else {
            return null;
        }
    }
}
