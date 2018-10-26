<?php

namespace League\OAuth2\Client\Provider\Exception;

use Psr\Http\Message\ResponseInterface;

class GithubIdentityProviderException extends IdentityProviderException
{
    /**
     * Creates client exception from response.
     *
     * @param  ResponseInterface $response
     * @param  string $data Parsed response data
     *
     * @return IdentityProviderException
     */
    public static function clientException(ResponseInterface $response, $data)
    {
        return static::fromResponse(
            $response,
            isset($data['message']) ? $data['message'] : $response->getReasonPhrase()
        );
    }

    /**
     * Creates oauth exception from response.
     *
     * @param  ResponseInterface $response
     * @param  string $data Parsed response data
     *
     * @return IdentityProviderException
     */
    public static function oauthException(ResponseInterface $response, $data)
    {
        return static::fromResponse(
            $response,
            isset($data['error']) ? $data['error'] : $response->getReasonPhrase()
        );
    }

    /**
     * Creates identity exception from response.
     *
     * @param  ResponseInterface $response
     * @param  string $message
     *
     * @return IdentityProviderException
     */
    protected static function fromResponse(ResponseInterface $response, $message = null)
    {
        return new static($message, $response->getStatusCode(), (string) $response->getBody());
    }
}
