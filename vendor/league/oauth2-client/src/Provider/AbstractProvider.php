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

namespace League\OAuth2\Client\Provider;

use GuzzleHttp\Client as HttpClient;
use GuzzleHttp\ClientInterface as HttpClientInterface;
use GuzzleHttp\Exception\BadResponseException;
use League\OAuth2\Client\Grant\AbstractGrant;
use League\OAuth2\Client\Grant\GrantFactory;
use League\OAuth2\Client\Provider\Exception\IdentityProviderException;
use League\OAuth2\Client\Token\AccessToken;
use League\OAuth2\Client\Tool\ArrayAccessorTrait;
use League\OAuth2\Client\Tool\QueryBuilderTrait;
use League\OAuth2\Client\Tool\RequestFactory;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;
use UnexpectedValueException;

/**
 * Represents a service provider (authorization server).
 *
 * @link http://tools.ietf.org/html/rfc6749#section-1.1 Roles (RFC 6749, §1.1)
 */
abstract class AbstractProvider
{
    use ArrayAccessorTrait;
    use QueryBuilderTrait;

    /**
     * @var string Key used in a token response to identify the resource owner.
     */
    const ACCESS_TOKEN_RESOURCE_OWNER_ID = null;

    /**
     * @var string HTTP method used to fetch access tokens.
     */
    const METHOD_GET = 'GET';

    /**
     * @var string HTTP method used to fetch access tokens.
     */
    const METHOD_POST = 'POST';

    /**
     * @var string
     */
    protected $clientId;

    /**
     * @var string
     */
    protected $clientSecret;

    /**
     * @var string
     */
    protected $redirectUri;

    /**
     * @var string
     */
    protected $state;

    /**
     * @var GrantFactory
     */
    protected $grantFactory;

    /**
     * @var RequestFactory
     */
    protected $requestFactory;

    /**
     * @var HttpClientInterface
     */
    protected $httpClient;

    /**
     * Constructs an OAuth 2.0 service provider.
     *
     * @param array $options An array of options to set on this provider.
     *     Options include `clientId`, `clientSecret`, `redirectUri`, and `state`.
     *     Individual providers may introduce more options, as needed.
     * @param array $collaborators An array of collaborators that may be used to
     *     override this provider's default behavior. Collaborators include
     *     `grantFactory`, `requestFactory`, and `httpClient`.
     *     Individual providers may introduce more collaborators, as needed.
     */
    public function __construct(array $options = [], array $collaborators = [])
    {
        foreach ($options as $option => $value) {
            if (property_exists($this, $option)) {
                $this->{$option} = $value;
            }
        }

        if (empty($collaborators['grantFactory'])) {
            $collaborators['grantFactory'] = new GrantFactory();
        }
        $this->setGrantFactory($collaborators['grantFactory']);

        if (empty($collaborators['requestFactory'])) {
            $collaborators['requestFactory'] = new RequestFactory();
        }
        $this->setRequestFactory($collaborators['requestFactory']);

        if (empty($collaborators['httpClient'])) {
            $client_options = $this->getAllowedClientOptions($options);

            $collaborators['httpClient'] = new HttpClient(
                array_intersect_key($options, array_flip($client_options))
            );
        }
        $this->setHttpClient($collaborators['httpClient']);
    }

    /**
     * Returns the list of options that can be passed to the HttpClient
     *
     * @param array $options An array of options to set on this provider.
     *     Options include `clientId`, `clientSecret`, `redirectUri`, and `state`.
     *     Individual providers may introduce more options, as needed.
     * @return array The options to pass to the HttpClient constructor
     */
    protected function getAllowedClientOptions(array $options)
    {
        $client_options = ['timeout', 'proxy'];

        // Only allow turning off ssl verification if it's for a proxy
        if (!empty($options['proxy'])) {
            $client_options[] = 'verify';
        }

        return $client_options;
    }

    /**
     * Sets the grant factory instance.
     *
     * @param  GrantFactory $factory
     * @return self
     */
    public function setGrantFactory(GrantFactory $factory)
    {
        $this->grantFactory = $factory;

        return $this;
    }

    /**
     * Returns the current grant factory instance.
     *
     * @return GrantFactory
     */
    public function getGrantFactory()
    {
        return $this->grantFactory;
    }

    /**
     * Sets the request factory instance.
     *
     * @param  RequestFactory $factory
     * @return self
     */
    public function setRequestFactory(RequestFactory $factory)
    {
        $this->requestFactory = $factory;

        return $this;
    }

    /**
     * Returns the request factory instance.
     *
     * @return RequestFactory
     */
    public function getRequestFactory()
    {
        return $this->requestFactory;
    }

    /**
     * Sets the HTTP client instance.
     *
     * @param  HttpClientInterface $client
     * @return self
     */
    public function setHttpClient(HttpClientInterface $client)
    {
        $this->httpClient = $client;

        return $this;
    }

    /**
     * Returns the HTTP client instance.
     *
     * @return HttpClientInterface
     */
    public function getHttpClient()
    {
        return $this->httpClient;
    }

    /**
     * Returns the current value of the state parameter.
     *
     * This can be accessed by the redirect handler during authorization.
     *
     * @return string
     */
    public function getState()
    {
        return $this->state;
    }

    /**
     * Returns the base URL for authorizing a client.
     *
     * Eg. https://oauth.service.com/authorize
     *
     * @return string
     */
    abstract public function getBaseAuthorizationUrl();

    /**
     * Returns the base URL for requesting an access token.
     *
     * Eg. https://oauth.service.com/token
     *
     * @param array $params
     * @return string
     */
    abstract public function getBaseAccessTokenUrl(array $params);

    /**
     * Returns the URL for requesting the resource owner's details.
     *
     * @param AccessToken $token
     * @return string
     */
    abstract public function getResourceOwnerDetailsUrl(AccessToken $token);

    /**
     * Returns a new random string to use as the state parameter in an
     * authorization flow.
     *
     * @param  int $length Length of the random string to be generated.
     * @return string
     */
    protected function getRandomState($length = 32)
    {
        // Converting bytes to hex will always double length. Hence, we can reduce
        // the amount of bytes by half to produce the correct length.
        return bin2hex(random_bytes($length / 2));
    }

    /**
     * Returns the default scopes used by this provider.
     *
     * This should only be the scopes that are required to request the details
     * of the resource owner, rather than all the available scopes.
     *
     * @return array
     */
    abstract protected function getDefaultScopes();

    /**
     * Returns the string that should be used to separate scopes when building
     * the URL for requesting an access token.
     *
     * @return string Scope separator, defaults to ','
     */
    protected function getScopeSeparator()
    {
        return ',';
    }

    /**
     * Returns authorization parameters based on provided options.
     *
     * @param  array $options
     * @return array Authorization parameters
     */
    protected function getAuthorizationParameters(array $options)
    {
        if (empty($options['state'])) {
            $options['state'] = $this->getRandomState();
        }

        if (empty($options['scope'])) {
            $options['scope'] = $this->getDefaultScopes();
        }

        $options += [
            'response_type'   => 'code',
            'approval_prompt' => 'auto'
        ];

        if (is_array($options['scope'])) {
            $separator = $this->getScopeSeparator();
            $options['scope'] = implode($separator, $options['scope']);
        }

        // Store the state as it may need to be accessed later on.
        $this->state = $options['state'];

        // Business code layer might set a different redirect_uri parameter
        // depending on the context, leave it as-is
        if (!isset($options['redirect_uri'])) {
            $options['redirect_uri'] = $this->redirectUri;
        }

        $options['client_id'] = $this->clientId;

        return $options;
    }

    /**
     * Builds the authorization URL's query string.
     *
     * @param  array $params Query parameters
     * @return string Query string
     */
    protected function getAuthorizationQuery(array $params)
    {
        return $this->buildQueryString($params);
    }

    /**
     * Builds the authorization URL.
     *
     * @param  array $options
     * @return string Authorization URL
     */
    public function getAuthorizationUrl(array $options = [])
    {
        $base   = $this->getBaseAuthorizationUrl();
        $params = $this->getAuthorizationParameters($options);
        $query  = $this->getAuthorizationQuery($params);

        return $this->appendQuery($base, $query);
    }

    /**
     * Redirects the client for authorization.
     *
     * @param  array $options
     * @param  callable|null $redirectHandler
     * @return mixed
     */
    public function authorize(
        array $options = [],
        callable $redirectHandler = null
    ) {
        $url = $this->getAuthorizationUrl($options);
        if ($redirectHandler) {
            return $redirectHandler($url, $this);
        }

        // @codeCoverageIgnoreStart
        header('Location: ' . $url);
        exit;
        // @codeCoverageIgnoreEnd
    }

    /**
     * Appends a query string to a URL.
     *
     * @param  string $url The URL to append the query to
     * @param  string $query The HTTP query string
     * @return string The resulting URL
     */
    protected function appendQuery($url, $query)
    {
        $query = trim($query, '?&');

        if ($query) {
            $glue = strstr($url, '?') === false ? '?' : '&';
            return $url . $glue . $query;
        }

        return $url;
    }

    /**
     * Returns the method to use when requesting an access token.
     *
     * @return string HTTP method
     */
    protected function getAccessTokenMethod()
    {
        return self::METHOD_POST;
    }

    /**
     * Returns the key used in the access token response to identify the resource owner.
     *
     * @return string|null Resource owner identifier key
     */
    protected function getAccessTokenResourceOwnerId()
    {
        return static::ACCESS_TOKEN_RESOURCE_OWNER_ID;
    }

    /**
     * Builds the access token URL's query string.
     *
     * @param  array $params Query parameters
     * @return string Query string
     */
    protected function getAccessTokenQuery(array $params)
    {
        return $this->buildQueryString($params);
    }

    /**
     * Checks that a provided grant is valid, or attempts to produce one if the
     * provided grant is a string.
     *
     * @param  AbstractGrant|string $grant
     * @return AbstractGrant
     */
    protected function verifyGrant($grant)
    {
        if (is_string($grant)) {
            return $this->grantFactory->getGrant($grant);
        }

        $this->grantFactory->checkGrant($grant);
        return $grant;
    }

    /**
     * Returns the full URL to use when requesting an access token.
     *
     * @param array $params Query parameters
     * @return string
     */
    protected function getAccessTokenUrl(array $params)
    {
        $url = $this->getBaseAccessTokenUrl($params);

        if ($this->getAccessTokenMethod() === self::METHOD_GET) {
            $query = $this->getAccessTokenQuery($params);
            return $this->appendQuery($url, $query);
        }

        return $url;
    }

    /**
     * Returns the request body for requesting an access token.
     *
     * @param  array $params
     * @return string
     */
    protected function getAccessTokenBody(array $params)
    {
        return $this->buildQueryString($params);
    }

    /**
     * Builds request options used for requesting an access token.
     *
     * @param  array $params
     * @return array
     */
    protected function getAccessTokenOptions(array $params)
    {
        $options = ['headers' => ['content-type' => 'application/x-www-form-urlencoded']];

        if ($this->getAccessTokenMethod() === self::METHOD_POST) {
            $options['body'] = $this->getAccessTokenBody($params);
        }

        return $options;
    }

    /**
     * Returns a prepared request for requesting an access token.
     *
     * @param array $params Query string parameters
     * @return RequestInterface
     */
    protected function getAccessTokenRequest(array $params)
    {
        $method  = $this->getAccessTokenMethod();
        $url     = $this->getAccessTokenUrl($params);
        $options = $this->getAccessTokenOptions($params);

        return $this->getRequest($method, $url, $options);
    }

    /**
     * Requests an access token using a specified grant and option set.
     *
     * @param  mixed $grant
     * @param  array $options
     * @return AccessToken
     */
    public function getAccessToken($grant, array $options = [])
    {
        $grant = $this->verifyGrant($grant);

        $params = [
            'client_id'     => $this->clientId,
            'client_secret' => $this->clientSecret,
            'redirect_uri'  => $this->redirectUri,
        ];

        $params   = $grant->prepareRequestParameters($params, $options);
        $request  = $this->getAccessTokenRequest($params);
        $response = $this->getParsedResponse($request);
        $prepared = $this->prepareAccessTokenResponse($response);
        $token    = $this->createAccessToken($prepared, $grant);

        return $token;
    }

    /**
     * Returns a PSR-7 request instance that is not authenticated.
     *
     * @param  string $method
     * @param  string $url
     * @param  array $options
     * @return RequestInterface
     */
    public function getRequest($method, $url, array $options = [])
    {
        return $this->createRequest($method, $url, null, $options);
    }

    /**
     * Returns an authenticated PSR-7 request instance.
     *
     * @param  string $method
     * @param  string $url
     * @param  AccessToken|string $token
     * @param  array $options Any of "headers", "body", and "protocolVersion".
     * @return RequestInterface
     */
    public function getAuthenticatedRequest($method, $url, $token, array $options = [])
    {
        return $this->createRequest($method, $url, $token, $options);
    }

    /**
     * Creates a PSR-7 request instance.
     *
     * @param  string $method
     * @param  string $url
     * @param  AccessToken|string|null $token
     * @param  array $options
     * @return RequestInterface
     */
    protected function createRequest($method, $url, $token, array $options)
    {
        $defaults = [
            'headers' => $this->getHeaders($token),
        ];

        $options = array_merge_recursive($defaults, $options);
        $factory = $this->getRequestFactory();

        return $factory->getRequestWithOptions($method, $url, $options);
    }

    /**
     * Sends a request instance and returns a response instance.
     *
     * WARNING: This method does not attempt to catch exceptions caused by HTTP
     * errors! It is recommended to wrap this method in a try/catch block.
     *
     * @param  RequestInterface $request
     * @return ResponseInterface
     */
    public function getResponse(RequestInterface $request)
    {
        return $this->getHttpClient()->send($request);
    }

    /**
     * Sends a request and returns the parsed response.
     *
     * @param  RequestInterface $request
     * @return mixed
     */
    public function getParsedResponse(RequestInterface $request)
    {
        try {
            $response = $this->getResponse($request);
        } catch (BadResponseException $e) {
            $response = $e->getResponse();
        }

        $parsed = $this->parseResponse($response);

        $this->checkResponse($response, $parsed);

        return $parsed;
    }

    /**
     * Attempts to parse a JSON response.
     *
     * @param  string $content JSON content from response body
     * @return array Parsed JSON data
     * @throws UnexpectedValueException if the content could not be parsed
     */
    protected function parseJson($content)
    {
        $content = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new UnexpectedValueException(sprintf(
                "Failed to parse JSON response: %s",
                json_last_error_msg()
            ));
        }

        return $content;
    }

    /**
     * Returns the content type header of a response.
     *
     * @param  ResponseInterface $response
     * @return string Semi-colon separated join of content-type headers.
     */
    protected function getContentType(ResponseInterface $response)
    {
        return join(';', (array) $response->getHeader('content-type'));
    }

    /**
     * Parses the response according to its content-type header.
     *
     * @throws UnexpectedValueException
     * @param  ResponseInterface $response
     * @return array
     */
    protected function parseResponse(ResponseInterface $response)
    {
        $content = (string) $response->getBody();
        $type = $this->getContentType($response);

        if (strpos($type, 'urlencoded') !== false) {
            parse_str($content, $parsed);
            return $parsed;
        }

        // Attempt to parse the string as JSON regardless of content type,
        // since some providers use non-standard content types. Only throw an
        // exception if the JSON could not be parsed when it was expected to.
        try {
            return $this->parseJson($content);
        } catch (UnexpectedValueException $e) {
            if (strpos($type, 'json') !== false) {
                throw $e;
            }

            if ($response->getStatusCode() == 500) {
                throw new UnexpectedValueException(
                    'An OAuth server error was encountered that did not contain a JSON body',
                    0,
                    $e
                );
            }

            return $content;
        }
    }

    /**
     * Checks a provider response for errors.
     *
     * @throws IdentityProviderException
     * @param  ResponseInterface $response
     * @param  array|string $data Parsed response data
     * @return void
     */
    abstract protected function checkResponse(ResponseInterface $response, $data);

    /**
     * Prepares an parsed access token response for a grant.
     *
     * Custom mapping of expiration, etc should be done here. Always call the
     * parent method when overloading this method.
     *
     * @param  mixed $result
     * @return array
     */
    protected function prepareAccessTokenResponse(array $result)
    {
        if ($this->getAccessTokenResourceOwnerId() !== null) {
            $result['resource_owner_id'] = $this->getValueByKey(
                $result,
                $this->getAccessTokenResourceOwnerId()
            );
        }
        return $result;
    }

    /**
     * Creates an access token from a response.
     *
     * The grant that was used to fetch the response can be used to provide
     * additional context.
     *
     * @param  array $response
     * @param  AbstractGrant $grant
     * @return AccessToken
     */
    protected function createAccessToken(array $response, AbstractGrant $grant)
    {
        return new AccessToken($response);
    }

    /**
     * Generates a resource owner object from a successful resource owner
     * details request.
     *
     * @param  array $response
     * @param  AccessToken $token
     * @return ResourceOwnerInterface
     */
    abstract protected function createResourceOwner(array $response, AccessToken $token);

    /**
     * Requests and returns the resource owner of given access token.
     *
     * @param  AccessToken $token
     * @return ResourceOwnerInterface
     */
    public function getResourceOwner(AccessToken $token)
    {
        $response = $this->fetchResourceOwnerDetails($token);

        return $this->createResourceOwner($response, $token);
    }

    /**
     * Requests resource owner details.
     *
     * @param  AccessToken $token
     * @return mixed
     */
    protected function fetchResourceOwnerDetails(AccessToken $token)
    {
        $url = $this->getResourceOwnerDetailsUrl($token);

        $request = $this->getAuthenticatedRequest(self::METHOD_GET, $url, $token);

        $response = $this->getParsedResponse($request);

        if (false === is_array($response)) {
            throw new UnexpectedValueException(
                'Invalid response received from Authorization Server. Expected JSON.'
            );
        }

        return $response;
    }

    /**
     * Returns the default headers used by this provider.
     *
     * Typically this is used to set 'Accept' or 'Content-Type' headers.
     *
     * @return array
     */
    protected function getDefaultHeaders()
    {
        return [];
    }

    /**
     * Returns the authorization headers used by this provider.
     *
     * Typically this is "Bearer" or "MAC". For more information see:
     * http://tools.ietf.org/html/rfc6749#section-7.1
     *
     * No default is provided, providers must overload this method to activate
     * authorization headers.
     *
     * @param  mixed|null $token Either a string or an access token instance
     * @return array
     */
    protected function getAuthorizationHeaders($token = null)
    {
        return [];
    }

    /**
     * Returns all headers used by this provider for a request.
     *
     * The request will be authenticated if an access token is provided.
     *
     * @param  mixed|null $token object or string
     * @return array
     */
    public function getHeaders($token = null)
    {
        if ($token) {
            return array_merge(
                $this->getDefaultHeaders(),
                $this->getAuthorizationHeaders($token)
            );
        }

        return $this->getDefaultHeaders();
    }
}
