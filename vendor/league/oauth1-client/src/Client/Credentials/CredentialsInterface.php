<?php

namespace League\OAuth1\Client\Credentials;

interface CredentialsInterface
{
    /**
     * Get the credentials identifier.
     *
     * @return string
     */
    public function getIdentifier();

    /**
     * Set the credentials identifier.
     *
     * @param string $identifier
     */
    public function setIdentifier($identifier);

    /**
     * Get the credentials secret.
     *
     * @return string
     */
    public function getSecret();

    /**
     * Set the credentials secret.
     *
     * @param string $secret
     */
    public function setSecret($secret);
}
