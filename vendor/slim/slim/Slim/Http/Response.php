<?php
/**
 * Slim Framework (https://slimframework.com)
 *
 * @license https://github.com/slimphp/Slim/blob/3.x/LICENSE.md (MIT License)
 */

namespace Slim\Http;

use InvalidArgumentException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\StreamInterface;
use Psr\Http\Message\UriInterface;
use RuntimeException;
use Slim\Interfaces\Http\HeadersInterface;

/**
 * Response
 *
 * This class represents an HTTP response. It manages
 * the response status, headers, and body
 * according to the PSR-7 standard.
 *
 * @link https://github.com/php-fig/http-message/blob/master/src/MessageInterface.php
 * @link https://github.com/php-fig/http-message/blob/master/src/ResponseInterface.php
 */
class Response extends Message implements ResponseInterface
{
    /**
     * Status code
     *
     * @var int
     */
    protected $status = StatusCode::HTTP_OK;

    /**
     * Reason phrase
     *
     * @var string
     */
    protected $reasonPhrase = '';

    /**
     * Status codes and reason phrases
     *
     * @var array
     */
    protected static $messages = [
        //Informational 1xx
        StatusCode::HTTP_CONTINUE => 'Continue',
        StatusCode::HTTP_SWITCHING_PROTOCOLS => 'Switching Protocols',
        StatusCode::HTTP_PROCESSING => 'Processing',
        //Successful 2xx
        StatusCode::HTTP_OK => 'OK',
        StatusCode::HTTP_CREATED => 'Created',
        StatusCode::HTTP_ACCEPTED => 'Accepted',
        StatusCode::HTTP_NONAUTHORITATIVE_INFORMATION => 'Non-Authoritative Information',
        StatusCode::HTTP_NO_CONTENT => 'No Content',
        StatusCode::HTTP_RESET_CONTENT => 'Reset Content',
        StatusCode::HTTP_PARTIAL_CONTENT => 'Partial Content',
        StatusCode::HTTP_MULTI_STATUS => 'Multi-Status',
        StatusCode::HTTP_ALREADY_REPORTED => 'Already Reported',
        StatusCode::HTTP_IM_USED => 'IM Used',
        //Redirection 3xx
        StatusCode::HTTP_MULTIPLE_CHOICES => 'Multiple Choices',
        StatusCode::HTTP_MOVED_PERMANENTLY => 'Moved Permanently',
        StatusCode::HTTP_FOUND => 'Found',
        StatusCode::HTTP_SEE_OTHER => 'See Other',
        StatusCode::HTTP_NOT_MODIFIED => 'Not Modified',
        StatusCode::HTTP_USE_PROXY => 'Use Proxy',
        StatusCode::HTTP_UNUSED => '(Unused)',
        StatusCode::HTTP_TEMPORARY_REDIRECT => 'Temporary Redirect',
        StatusCode::HTTP_PERMANENT_REDIRECT => 'Permanent Redirect',
        //Client Error 4xx
        StatusCode::HTTP_BAD_REQUEST => 'Bad Request',
        StatusCode::HTTP_UNAUTHORIZED => 'Unauthorized',
        StatusCode::HTTP_PAYMENT_REQUIRED => 'Payment Required',
        StatusCode::HTTP_FORBIDDEN => 'Forbidden',
        StatusCode::HTTP_NOT_FOUND => 'Not Found',
        StatusCode::HTTP_METHOD_NOT_ALLOWED => 'Method Not Allowed',
        StatusCode::HTTP_NOT_ACCEPTABLE => 'Not Acceptable',
        StatusCode::HTTP_PROXY_AUTHENTICATION_REQUIRED => 'Proxy Authentication Required',
        StatusCode::HTTP_REQUEST_TIMEOUT => 'Request Timeout',
        StatusCode::HTTP_CONFLICT => 'Conflict',
        StatusCode::HTTP_GONE => 'Gone',
        StatusCode::HTTP_LENGTH_REQUIRED => 'Length Required',
        StatusCode::HTTP_PRECONDITION_FAILED => 'Precondition Failed',
        StatusCode::HTTP_REQUEST_ENTITY_TOO_LARGE => 'Request Entity Too Large',
        StatusCode::HTTP_REQUEST_URI_TOO_LONG => 'Request-URI Too Long',
        StatusCode::HTTP_UNSUPPORTED_MEDIA_TYPE => 'Unsupported Media Type',
        StatusCode::HTTP_REQUESTED_RANGE_NOT_SATISFIABLE => 'Requested Range Not Satisfiable',
        StatusCode::HTTP_EXPECTATION_FAILED => 'Expectation Failed',
        StatusCode::HTTP_IM_A_TEAPOT => 'I\'m a teapot',
        StatusCode::HTTP_MISDIRECTED_REQUEST => 'Misdirected Request',
        StatusCode::HTTP_UNPROCESSABLE_ENTITY => 'Unprocessable Entity',
        StatusCode::HTTP_LOCKED => 'Locked',
        StatusCode::HTTP_FAILED_DEPENDENCY => 'Failed Dependency',
        StatusCode::HTTP_UPGRADE_REQUIRED => 'Upgrade Required',
        StatusCode::HTTP_PRECONDITION_REQUIRED => 'Precondition Required',
        StatusCode::HTTP_TOO_MANY_REQUESTS => 'Too Many Requests',
        StatusCode::HTTP_REQUEST_HEADER_FIELDS_TOO_LARGE => 'Request Header Fields Too Large',
        StatusCode::HTTP_CONNECTION_CLOSED_WITHOUT_RESPONSE => 'Connection Closed Without Response',
        StatusCode::HTTP_UNAVAILABLE_FOR_LEGAL_REASONS => 'Unavailable For Legal Reasons',
        StatusCode::HTTP_CLIENT_CLOSED_REQUEST => 'Client Closed Request',
        //Server Error 5xx
        StatusCode::HTTP_INTERNAL_SERVER_ERROR => 'Internal Server Error',
        StatusCode::HTTP_NOT_IMPLEMENTED => 'Not Implemented',
        StatusCode::HTTP_BAD_GATEWAY => 'Bad Gateway',
        StatusCode::HTTP_SERVICE_UNAVAILABLE => 'Service Unavailable',
        StatusCode::HTTP_GATEWAY_TIMEOUT => 'Gateway Timeout',
        StatusCode::HTTP_VERSION_NOT_SUPPORTED => 'HTTP Version Not Supported',
        StatusCode::HTTP_VARIANT_ALSO_NEGOTIATES => 'Variant Also Negotiates',
        StatusCode::HTTP_INSUFFICIENT_STORAGE => 'Insufficient Storage',
        StatusCode::HTTP_LOOP_DETECTED => 'Loop Detected',
        StatusCode::HTTP_NOT_EXTENDED => 'Not Extended',
        StatusCode::HTTP_NETWORK_AUTHENTICATION_REQUIRED => 'Network Authentication Required',
        StatusCode::HTTP_NETWORK_CONNECTION_TIMEOUT_ERROR => 'Network Connect Timeout Error',
    ];

    /**
     * EOL characters used for HTTP response.
     *
     * @var string
     */
    const EOL = "\r\n";

    /**
     * @param int                   $status  The response status code.
     * @param HeadersInterface|null $headers The response headers.
     * @param StreamInterface|null  $body    The response body.
     */
    public function __construct(
        $status = StatusCode::HTTP_OK,
        HeadersInterface $headers = null,
        StreamInterface $body = null
    ) {
        $this->status = $this->filterStatus($status);
        $this->headers = $headers ? $headers : new Headers();
        $this->body = $body ? $body : new Body(fopen('php://temp', 'r+'));
    }

    /**
     * This method is applied to the cloned object
     * after PHP performs an initial shallow-copy. This
     * method completes a deep-copy by creating new objects
     * for the cloned object's internal reference pointers.
     */
    public function __clone()
    {
        $this->headers = clone $this->headers;
    }

    /**
     * Gets the response status code.
     *
     * The status code is a 3-digit integer result code of the server's attempt
     * to understand and satisfy the request.
     *
     * @return int
     */
    public function getStatusCode()
    {
        return $this->status;
    }

    /**
     * Return an instance with the specified status code and, optionally, reason phrase.
     *
     * If no reason phrase is specified, implementations MAY choose to default
     * to the RFC 7231 or IANA recommended reason phrase for the response's
     * status code.
     *
     * This method MUST be implemented in such a way as to retain the
     * immutability of the message, and MUST return an instance that has the
     * updated status and reason phrase.
     *
     * @link http://tools.ietf.org/html/rfc7231#section-6
     * @link http://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
     *
     * @param int $code The 3-digit integer result code to set.
     * @param string $reasonPhrase The reason phrase to use with the
     *     provided status code; if none is provided, implementations MAY
     *     use the defaults as suggested in the HTTP specification.
     *
     * @return static
     *
     * @throws InvalidArgumentException For invalid status code arguments.
     */
    public function withStatus($code, $reasonPhrase = '')
    {
        $code = $this->filterStatus($code);

        if (!is_string($reasonPhrase) && !method_exists($reasonPhrase, '__toString')) {
            throw new InvalidArgumentException('ReasonPhrase must be a string');
        }

        $clone = clone $this;
        $clone->status = $code;
        if ($reasonPhrase === '' && isset(static::$messages[$code])) {
            $reasonPhrase = static::$messages[$code];
        }

        if ($reasonPhrase === '') {
            throw new InvalidArgumentException('ReasonPhrase must be supplied for this code');
        }

        $clone->reasonPhrase = $reasonPhrase;

        return $clone;
    }

    /**
     * Filter HTTP status code.
     *
     * @param  int $status HTTP status code.
     *
     * @return int
     *
     * @throws InvalidArgumentException If an invalid HTTP status code is provided.
     */
    protected function filterStatus($status)
    {
        if (!is_integer($status) ||
            $status<StatusCode::HTTP_CONTINUE ||
            $status>StatusCode::HTTP_NETWORK_CONNECTION_TIMEOUT_ERROR
        ) {
            throw new InvalidArgumentException('Invalid HTTP status code');
        }

        return $status;
    }

    /**
     * Gets the response reason phrase associated with the status code.
     *
     * Because a reason phrase is not a required element in a response
     * status line, the reason phrase value MAY be null. Implementations MAY
     * choose to return the default RFC 7231 recommended reason phrase (or those
     * listed in the IANA HTTP Status Code Registry) for the response's
     * status code.
     *
     * @link http://tools.ietf.org/html/rfc7231#section-6
     * @link http://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
     *
     * @return string Reason phrase; must return an empty string if none present.
     */
    public function getReasonPhrase()
    {
        if ($this->reasonPhrase) {
            return $this->reasonPhrase;
        }
        if (isset(static::$messages[$this->status])) {
            return static::$messages[$this->status];
        }
        return '';
    }

    /**
     * Return an instance with the provided value replacing the specified header.
     *
     * If a Location header is set and the status code is 200, then set the status
     * code to 302 to mimic what PHP does. See https://github.com/slimphp/Slim/issues/1730
     *
     * @param string $name Case-insensitive header field name.
     * @param string|string[] $value Header value(s).
     *
     * @return static
     *
     * @throws InvalidArgumentException For invalid header names or values.
     */
    public function withHeader($name, $value)
    {
        $clone = clone $this;
        $clone->headers->set($name, $value);

        if ($this->body instanceof NonBufferedBody) {
            header(sprintf('%s: %s', $name, $clone->getHeaderLine($name)));
        }

        if ($clone->getStatusCode() === StatusCode::HTTP_OK && strtolower($name) === 'location') {
            $clone = $clone->withStatus(StatusCode::HTTP_FOUND);
        }

        return $clone;
    }

    /**
     * Write data to the response body.
     *
     * Note: This method is not part of the PSR-7 standard.
     *
     * Proxies to the underlying stream and writes the provided data to it.
     *
     * @param string $data
     *
     * @return static
     */
    public function write($data)
    {
        $this->getBody()->write($data);

        return $this;
    }

    /**
     * Redirect.
     *
     * Note: This method is not part of the PSR-7 standard.
     *
     * This method prepares the response object to return an HTTP Redirect
     * response to the client.
     *
     * @param  string|UriInterface $url    The redirect destination.
     * @param  int|null            $status The redirect HTTP status code.
     *
     * @return static
     */
    public function withRedirect($url, $status = null)
    {
        $responseWithRedirect = $this->withHeader('Location', (string)$url);

        if (is_null($status) && $this->getStatusCode() === StatusCode::HTTP_OK) {
            $status = StatusCode::HTTP_FOUND;
        }

        if (!is_null($status)) {
            return $responseWithRedirect->withStatus($status);
        }

        return $responseWithRedirect;
    }

    /**
     * Json.
     *
     * Note: This method is not part of the PSR-7 standard.
     *
     * This method prepares the response object to return an HTTP Json
     * response to the client.
     *
     * @param  mixed $data   The data
     * @param  int   $status The HTTP status code.
     * @param  int   $encodingOptions Json encoding options
     *
     * @return static
     *
     * @throws RuntimeException
     */
    public function withJson($data, $status = null, $encodingOptions = 0)
    {
        $response = $this->withBody(new Body(fopen('php://temp', 'r+')));
        $response->body->write($json = json_encode($data, $encodingOptions));

        // Ensure that the json encoding passed successfully
        if ($json === false) {
            throw new RuntimeException(json_last_error_msg(), json_last_error());
        }

        $responseWithJson = $response->withHeader('Content-Type', 'application/json');
        if (isset($status)) {
            return $responseWithJson->withStatus($status);
        }
        return $responseWithJson;
    }

    /**
     * Is this response empty?
     *
     * Note: This method is not part of the PSR-7 standard.
     *
     * @return bool
     */
    public function isEmpty()
    {
        return in_array(
            $this->getStatusCode(),
            [StatusCode::HTTP_NO_CONTENT, StatusCode::HTTP_RESET_CONTENT, StatusCode::HTTP_NOT_MODIFIED]
        );
    }

    /**
     * Is this response informational?
     *
     * Note: This method is not part of the PSR-7 standard.
     *
     * @return bool
     */
    public function isInformational()
    {
        return $this->getStatusCode() >= StatusCode::HTTP_CONTINUE && $this->getStatusCode() < StatusCode::HTTP_OK;
    }

    /**
     * Is this response OK?
     *
     * Note: This method is not part of the PSR-7 standard.
     *
     * @return bool
     */
    public function isOk()
    {
        return $this->getStatusCode() === StatusCode::HTTP_OK;
    }

    /**
     * Is this response successful?
     *
     * Note: This method is not part of the PSR-7 standard.
     *
     * @return bool
     */
    public function isSuccessful()
    {
        return $this->getStatusCode() >= StatusCode::HTTP_OK &&
            $this->getStatusCode() < StatusCode::HTTP_MULTIPLE_CHOICES;
    }

    /**
     * Is this response a redirect?
     *
     * Note: This method is not part of the PSR-7 standard.
     *
     * @return bool
     */
    public function isRedirect()
    {
        return in_array(
            $this->getStatusCode(),
            [
                StatusCode::HTTP_MOVED_PERMANENTLY,
                StatusCode::HTTP_FOUND,
                StatusCode::HTTP_SEE_OTHER,
                StatusCode::HTTP_TEMPORARY_REDIRECT,
                StatusCode::HTTP_PERMANENT_REDIRECT
            ]
        );
    }

    /**
     * Is this response a redirection?
     *
     * Note: This method is not part of the PSR-7 standard.
     *
     * @return bool
     */
    public function isRedirection()
    {
        return $this->getStatusCode() >= StatusCode::HTTP_MULTIPLE_CHOICES &&
            $this->getStatusCode() < StatusCode::HTTP_BAD_REQUEST;
    }

    /**
     * Is this response forbidden?
     *
     * Note: This method is not part of the PSR-7 standard.
     *
     * @return bool
     */
    public function isForbidden()
    {
        return $this->getStatusCode() === StatusCode::HTTP_FORBIDDEN;
    }

    /**
     * Is this response not Found?
     *
     * Note: This method is not part of the PSR-7 standard.
     *
     * @return bool
     */
    public function isNotFound()
    {
        return $this->getStatusCode() === StatusCode::HTTP_NOT_FOUND;
    }

    /**
     * Is this a bad request?
     *
     * Note: This method is not part of the PSR-7 standard.
     *
     * @return bool
     */
    public function isBadRequest()
    {
        return $this->getStatusCode() === StatusCode::HTTP_BAD_REQUEST;
    }

    /**
     * Is this response a client error?
     *
     * Note: This method is not part of the PSR-7 standard.
     *
     * @return bool
     */
    public function isClientError()
    {
        return $this->getStatusCode() >= StatusCode::HTTP_BAD_REQUEST &&
            $this->getStatusCode() < StatusCode::HTTP_INTERNAL_SERVER_ERROR;
    }

    /**
     * Is this response a server error?
     *
     * Note: This method is not part of the PSR-7 standard.
     *
     * @return bool
     */
    public function isServerError()
    {
        return $this->getStatusCode() >= StatusCode::HTTP_INTERNAL_SERVER_ERROR && $this->getStatusCode() < 600;
    }

    /**
     * Convert response to string.
     *
     * Note: This method is not part of the PSR-7 standard.
     *
     * @return string
     */
    public function __toString()
    {
        $output = sprintf(
            'HTTP/%s %s %s',
            $this->getProtocolVersion(),
            $this->getStatusCode(),
            $this->getReasonPhrase()
        );
        $output .= Response::EOL;
        foreach ($this->getHeaders() as $name => $values) {
            $output .= sprintf('%s: %s', $name, $this->getHeaderLine($name)) . Response::EOL;
        }
        $output .= Response::EOL;
        $output .= (string)$this->getBody();

        return $output;
    }
}
