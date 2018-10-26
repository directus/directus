<?php

namespace League\OAuth1\Client\Server;

use GuzzleHttp\Client as GuzzleHttpClient;
use GuzzleHttp\Exception\BadResponseException;
use League\OAuth1\Client\Credentials\ClientCredentialsInterface;
use League\OAuth1\Client\Credentials\ClientCredentials;
use League\OAuth1\Client\Credentials\CredentialsInterface;
use League\OAuth1\Client\Credentials\CredentialsException;
use League\OAuth1\Client\Credentials\TemporaryCredentials;
use League\OAuth1\Client\Credentials\TokenCredentials;
use League\OAuth1\Client\Signature\HmacSha1Signature;
use League\OAuth1\Client\Signature\SignatureInterface;

abstract class Server
{
    /**
     * Client credentials.
     *
     * @var ClientCredentials
     */
    protected $clientCredentials;

    /**
     * Signature.
     *
     * @var SignatureInterface
     */
    protected $signature;

    /**
     * The response type for data returned from API calls.
     *
     * @var string
     */
    protected $responseType = 'json';

    /**
     * Cached user details response.
     *
     * @var unknown
     */
    protected $cachedUserDetailsResponse;

    /**
     * Optional user agent.
     *
     * @var string
     */
    protected $userAgent;

    /**
     * Create a new server instance.
     *
     * @param ClientCredentialsInterface|array $clientCredentials
     * @param SignatureInterface               $signature
     */
    public function __construct($clientCredentials, SignatureInterface $signature = null)
    {
        // Pass through an array or client credentials, we don't care
        if (is_array($clientCredentials)) {
            $clientCredentials = $this->createClientCredentials($clientCredentials);
        } elseif (!$clientCredentials instanceof ClientCredentialsInterface) {
            throw new \InvalidArgumentException('Client credentials must be an array or valid object.');
        }

        $this->clientCredentials = $clientCredentials;
        $this->signature = $signature ?: new HmacSha1Signature($clientCredentials);
    }

    /**
     * Gets temporary credentials by performing a request to
     * the server.
     *
     * @return TemporaryCredentials
     */
    public function getTemporaryCredentials()
    {
        $uri = $this->urlTemporaryCredentials();

        $client = $this->createHttpClient();

        $header = $this->temporaryCredentialsProtocolHeader($uri);
        $authorizationHeader = array('Authorization' => $header);
        $headers = $this->buildHttpClientHeaders($authorizationHeader);

        try {
            $response = $client->post($uri, [
                'headers' => $headers,
            ]);
        } catch (BadResponseException $e) {
            return $this->handleTemporaryCredentialsBadResponse($e);
        }

        return $this->createTemporaryCredentials((string) $response->getBody());
    }

    /**
     * Get the authorization URL by passing in the temporary credentials
     * identifier or an object instance.
     *
     * @param TemporaryCredentials|string $temporaryIdentifier
     *
     * @return string
     */
    public function getAuthorizationUrl($temporaryIdentifier)
    {
        // Somebody can pass through an instance of temporary
        // credentials and we'll extract the identifier from there.
        if ($temporaryIdentifier instanceof TemporaryCredentials) {
            $temporaryIdentifier = $temporaryIdentifier->getIdentifier();
        }

        $parameters = array('oauth_token' => $temporaryIdentifier);

        $url = $this->urlAuthorization();
        $queryString = http_build_query($parameters);

        return $this->buildUrl($url, $queryString);
    }

    /**
     * Redirect the client to the authorization URL.
     *
     * @param TemporaryCredentials|string $temporaryIdentifier
     */
    public function authorize($temporaryIdentifier)
    {
        $url = $this->getAuthorizationUrl($temporaryIdentifier);

        header('Location: '.$url);

        return;
    }

    /**
     * Retrieves token credentials by passing in the temporary credentials,
     * the temporary credentials identifier as passed back by the server
     * and finally the verifier code.
     *
     * @param TemporaryCredentials $temporaryCredentials
     * @param string               $temporaryIdentifier
     * @param string               $verifier
     *
     * @return TokenCredentials
     */
    public function getTokenCredentials(TemporaryCredentials $temporaryCredentials, $temporaryIdentifier, $verifier)
    {
        if ($temporaryIdentifier !== $temporaryCredentials->getIdentifier()) {
            throw new \InvalidArgumentException(
                'Temporary identifier passed back by server does not match that of stored temporary credentials.
                Potential man-in-the-middle.'
            );
        }

        $uri = $this->urlTokenCredentials();
        $bodyParameters = array('oauth_verifier' => $verifier);

        $client = $this->createHttpClient();

        $headers = $this->getHeaders($temporaryCredentials, 'POST', $uri, $bodyParameters);

        try {
            $response = $client->post($uri, [
                'headers' => $headers,
                'form_params' => $bodyParameters,
            ]);
        } catch (BadResponseException $e) {
            return $this->handleTokenCredentialsBadResponse($e);
        }

        return $this->createTokenCredentials((string) $response->getBody());
    }

    /**
     * Get user details by providing valid token credentials.
     *
     * @param TokenCredentials $tokenCredentials
     * @param bool             $force
     *
     * @return \League\OAuth1\Client\Server\User
     */
    public function getUserDetails(TokenCredentials $tokenCredentials, $force = false)
    {
        $data = $this->fetchUserDetails($tokenCredentials, $force);

        return $this->userDetails($data, $tokenCredentials);
    }

    /**
     * Get the user's unique identifier (primary key).
     *
     * @param TokenCredentials $tokenCredentials
     * @param bool             $force
     *
     * @return string|int
     */
    public function getUserUid(TokenCredentials $tokenCredentials, $force = false)
    {
        $data = $this->fetchUserDetails($tokenCredentials, $force);

        return $this->userUid($data, $tokenCredentials);
    }

    /**
     * Get the user's email, if available.
     *
     * @param TokenCredentials $tokenCredentials
     * @param bool             $force
     *
     * @return string|null
     */
    public function getUserEmail(TokenCredentials $tokenCredentials, $force = false)
    {
        $data = $this->fetchUserDetails($tokenCredentials, $force);

        return $this->userEmail($data, $tokenCredentials);
    }

    /**
     * Get the user's screen name (username), if available.
     *
     * @param TokenCredentials $tokenCredentials
     * @param bool             $force
     *
     * @return string
     */
    public function getUserScreenName(TokenCredentials $tokenCredentials, $force = false)
    {
        $data = $this->fetchUserDetails($tokenCredentials, $force);

        return $this->userScreenName($data, $tokenCredentials);
    }

    /**
     * Fetch user details from the remote service.
     *
     * @param TokenCredentials $tokenCredentials
     * @param bool             $force
     *
     * @return array HTTP client response
     */
    protected function fetchUserDetails(TokenCredentials $tokenCredentials, $force = true)
    {
        if (!$this->cachedUserDetailsResponse || $force) {
            $url = $this->urlUserDetails();

            $client = $this->createHttpClient();

            $headers = $this->getHeaders($tokenCredentials, 'GET', $url);

            try {
                $response = $client->get($url, [
                    'headers' => $headers,
                ]);
            } catch (BadResponseException $e) {
                $response = $e->getResponse();
                $body = $response->getBody();
                $statusCode = $response->getStatusCode();

                throw new \Exception(
                    "Received error [$body] with status code [$statusCode] when retrieving token credentials."
                );
            }
            switch ($this->responseType) {
                case 'json':
                    $this->cachedUserDetailsResponse = json_decode((string) $response->getBody(), true);
                    break;

                case 'xml':
                    $this->cachedUserDetailsResponse = simplexml_load_string((string) $response->getBody());
                    break;

                case 'string':
                    parse_str((string) $response->getBody(), $this->cachedUserDetailsResponse);
                    break;

                default:
                    throw new \InvalidArgumentException("Invalid response type [{$this->responseType}].");
            }
        }

        return $this->cachedUserDetailsResponse;
    }

    /**
     * Get the client credentials associated with the server.
     *
     * @return ClientCredentialsInterface
     */
    public function getClientCredentials()
    {
        return $this->clientCredentials;
    }

    /**
     * Get the signature associated with the server.
     *
     * @return SignatureInterface
     */
    public function getSignature()
    {
        return $this->signature;
    }

    /**
     * Creates a Guzzle HTTP client for the given URL.
     *
     * @return GuzzleHttpClient
     */
    public function createHttpClient()
    {
        return new GuzzleHttpClient();
    }

    /**
     * Set the user agent value.
     *
     * @param string $userAgent
     *
     * @return Server
     */
    public function setUserAgent($userAgent = null)
    {
        $this->userAgent = $userAgent;

        return $this;
    }

    /**
     * Get all headers required to created an authenticated request.
     *
     * @param CredentialsInterface $credentials
     * @param string               $method
     * @param string               $url
     * @param array                $bodyParameters
     *
     * @return array
     */
    public function getHeaders(CredentialsInterface $credentials, $method, $url, array $bodyParameters = array())
    {
        $header = $this->protocolHeader(strtoupper($method), $url, $credentials, $bodyParameters);
        $authorizationHeader = array('Authorization' => $header);
        $headers = $this->buildHttpClientHeaders($authorizationHeader);

        return $headers;
    }

    /**
     * Get Guzzle HTTP client default headers.
     *
     * @return array
     */
    protected function getHttpClientDefaultHeaders()
    {
        $defaultHeaders = array();
        if (!empty($this->userAgent)) {
            $defaultHeaders['User-Agent'] = $this->userAgent;
        }

        return $defaultHeaders;
    }

    /**
     * Build Guzzle HTTP client headers.
     *
     * @return array
     */
    protected function buildHttpClientHeaders($headers = array())
    {
        $defaultHeaders = $this->getHttpClientDefaultHeaders();

        return array_merge($headers, $defaultHeaders);
    }

    /**
     * Creates a client credentials instance from an array of credentials.
     *
     * @param array $clientCredentials
     *
     * @return ClientCredentials
     */
    protected function createClientCredentials(array $clientCredentials)
    {
        $keys = array('identifier', 'secret');

        foreach ($keys as $key) {
            if (!isset($clientCredentials[$key])) {
                throw new \InvalidArgumentException("Missing client credentials key [$key] from options.");
            }
        }

        $_clientCredentials = new ClientCredentials();
        $_clientCredentials->setIdentifier($clientCredentials['identifier']);
        $_clientCredentials->setSecret($clientCredentials['secret']);

        if (isset($clientCredentials['callback_uri'])) {
            $_clientCredentials->setCallbackUri($clientCredentials['callback_uri']);
        }

        return $_clientCredentials;
    }

    /**
     * Handle a bad response coming back when getting temporary credentials.
     *
     * @param BadResponseException $e
     *
     * @throws CredentialsException
     */
    protected function handleTemporaryCredentialsBadResponse(BadResponseException $e)
    {
        $response = $e->getResponse();
        $body = $response->getBody();
        $statusCode = $response->getStatusCode();

        throw new CredentialsException(
            "Received HTTP status code [$statusCode] with message \"$body\" when getting temporary credentials."
        );
    }

    /**
     * Creates temporary credentials from the body response.
     *
     * @param string $body
     *
     * @return TemporaryCredentials
     */
    protected function createTemporaryCredentials($body)
    {
        parse_str($body, $data);

        if (!$data || !is_array($data)) {
            throw new CredentialsException('Unable to parse temporary credentials response.');
        }

        if (!isset($data['oauth_callback_confirmed']) || $data['oauth_callback_confirmed'] != 'true') {
            throw new CredentialsException('Error in retrieving temporary credentials.');
        }

        $temporaryCredentials = new TemporaryCredentials();
        $temporaryCredentials->setIdentifier($data['oauth_token']);
        $temporaryCredentials->setSecret($data['oauth_token_secret']);

        return $temporaryCredentials;
    }

    /**
     * Handle a bad response coming back when getting token credentials.
     *
     * @param BadResponseException $e
     *
     * @throws CredentialsException
     */
    protected function handleTokenCredentialsBadResponse(BadResponseException $e)
    {
        $response = $e->getResponse();
        $body = $response->getBody();
        $statusCode = $response->getStatusCode();

        throw new CredentialsException(
            "Received HTTP status code [$statusCode] with message \"$body\" when getting token credentials."
        );
    }

    /**
     * Creates token credentials from the body response.
     *
     * @param string $body
     *
     * @return TokenCredentials
     */
    protected function createTokenCredentials($body)
    {
        parse_str($body, $data);

        if (!$data || !is_array($data)) {
            throw new CredentialsException('Unable to parse token credentials response.');
        }

        if (isset($data['error'])) {
            throw new CredentialsException("Error [{$data['error']}] in retrieving token credentials.");
        }

        $tokenCredentials = new TokenCredentials();
        $tokenCredentials->setIdentifier($data['oauth_token']);
        $tokenCredentials->setSecret($data['oauth_token_secret']);

        return $tokenCredentials;
    }

    /**
     * Get the base protocol parameters for an OAuth request.
     * Each request builds on these parameters.
     *
     * @return array
     *
     * @see    OAuth 1.0 RFC 5849 Section 3.1
     */
    protected function baseProtocolParameters()
    {
        $dateTime = new \DateTime();

        return array(
            'oauth_consumer_key' => $this->clientCredentials->getIdentifier(),
            'oauth_nonce' => $this->nonce(),
            'oauth_signature_method' => $this->signature->method(),
            'oauth_timestamp' => $dateTime->format('U'),
            'oauth_version' => '1.0',
        );
    }

    /**
     * Any additional required protocol parameters for an
     * OAuth request.
     *
     * @return array
     */
    protected function additionalProtocolParameters()
    {
        return array();
    }

    /**
     * Generate the OAuth protocol header for a temporary credentials
     * request, based on the URI.
     *
     * @param string $uri
     *
     * @return string
     */
    protected function temporaryCredentialsProtocolHeader($uri)
    {
        $parameters = array_merge($this->baseProtocolParameters(), array(
            'oauth_callback' => $this->clientCredentials->getCallbackUri(),
        ));

        $parameters['oauth_signature'] = $this->signature->sign($uri, $parameters, 'POST');

        return $this->normalizeProtocolParameters($parameters);
    }

    /**
     * Generate the OAuth protocol header for requests other than temporary
     * credentials, based on the URI, method, given credentials & body query
     * string.
     *
     * @param string               $method
     * @param string               $uri
     * @param CredentialsInterface $credentials
     * @param array                $bodyParameters
     *
     * @return string
     */
    protected function protocolHeader($method, $uri, CredentialsInterface $credentials, array $bodyParameters = array())
    {
        $parameters = array_merge(
            $this->baseProtocolParameters(),
            $this->additionalProtocolParameters(),
            array(
                'oauth_token' => $credentials->getIdentifier(),
            )
        );

        $this->signature->setCredentials($credentials);

        $parameters['oauth_signature'] = $this->signature->sign(
            $uri,
            array_merge($parameters, $bodyParameters),
            $method
        );

        return $this->normalizeProtocolParameters($parameters);
    }

    /**
     * Takes an array of protocol parameters and normalizes them
     * to be used as a HTTP header.
     *
     * @param array $parameters
     *
     * @return string
     */
    protected function normalizeProtocolParameters(array $parameters)
    {
        array_walk($parameters, function (&$value, $key) {
            $value = rawurlencode($key).'="'.rawurlencode($value).'"';
        });

        return 'OAuth '.implode(', ', $parameters);
    }

    /**
     * Generate a random string.
     *
     * @param int $length
     *
     * @return string
     *
     * @see    OAuth 1.0 RFC 5849 Section 3.3
     */
    protected function nonce($length = 32)
    {
        $pool = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

        return substr(str_shuffle(str_repeat($pool, 5)), 0, $length);
    }

    /**
     * Build a url by combining hostname and query string after checking for
     * exisiting '?' character in host.
     *
     * @param string $host
     * @param string $queryString
     *
     * @return string
     */
    protected function buildUrl($host, $queryString)
    {
        return $host.(strpos($host, '?') !== false ? '&' : '?').$queryString;
    }

    /**
     * Get the URL for retrieving temporary credentials.
     *
     * @return string
     */
    abstract public function urlTemporaryCredentials();

    /**
     * Get the URL for redirecting the resource owner to authorize the client.
     *
     * @return string
     */
    abstract public function urlAuthorization();

    /**
     * Get the URL retrieving token credentials.
     *
     * @return string
     */
    abstract public function urlTokenCredentials();

    /**
     * Get the URL for retrieving user details.
     *
     * @return string
     */
    abstract public function urlUserDetails();

    /**
     * Take the decoded data from the user details URL and convert
     * it to a User object.
     *
     * @param mixed            $data
     * @param TokenCredentials $tokenCredentials
     *
     * @return User
     */
    abstract public function userDetails($data, TokenCredentials $tokenCredentials);

    /**
     * Take the decoded data from the user details URL and extract
     * the user's UID.
     *
     * @param mixed            $data
     * @param TokenCredentials $tokenCredentials
     *
     * @return string|int
     */
    abstract public function userUid($data, TokenCredentials $tokenCredentials);

    /**
     * Take the decoded data from the user details URL and extract
     * the user's email.
     *
     * @param mixed            $data
     * @param TokenCredentials $tokenCredentials
     *
     * @return string
     */
    abstract public function userEmail($data, TokenCredentials $tokenCredentials);

    /**
     * Take the decoded data from the user details URL and extract
     * the user's screen name.
     *
     * @param mixed            $data
     * @param TokenCredentials $tokenCredentials
     *
     * @return string
     */
    abstract public function userScreenName($data, TokenCredentials $tokenCredentials);
}
