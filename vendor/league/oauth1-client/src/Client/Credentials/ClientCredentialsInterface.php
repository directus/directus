<?php

namespace League\OAuth1\Client\Credentials;

interface ClientCredentialsInterface extends CredentialsInterface
{
    /**
     * Get the credentials callback URI.
     *
     * @return string
     */
    public function getCallbackUri();

    /**
     * Set the credentials callback URI.
     *
     * @return string
     */
    public function setCallbackUri($callbackUri);
}
