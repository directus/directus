<?php

namespace League\OAuth1\Client\Signature;

use League\OAuth1\Client\Credentials\ClientCredentialsInterface;
use League\OAuth1\Client\Credentials\CredentialsInterface;

interface SignatureInterface
{
    /**
     * Create a new signature instance.
     *
     * @param ClientCredentialsInterface $clientCredentials
     */
    public function __construct(ClientCredentialsInterface $clientCredentials);

    /**
     * Set the credentials used in the signature. These can be temporary
     * credentials when getting token credentials during the OAuth
     * authentication process, or token credentials when querying
     * the API.
     *
     * @param CredentialsInterface $credentials
     */
    public function setCredentials(CredentialsInterface $credentials);

    /**
     * Get the OAuth signature method.
     *
     * @return string
     */
    public function method();

    /**
     * Sign the given request for the client.
     *
     * @param string $uri
     * @param array  $parameters
     * @param string $method
     *
     * @return string
     */
    public function sign($uri, array $parameters = array(), $method = 'POST');
}
