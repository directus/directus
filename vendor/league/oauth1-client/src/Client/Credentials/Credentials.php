<?php

namespace League\OAuth1\Client\Credentials;

abstract class Credentials implements CredentialsInterface
{
    /**
     * The credentials identifier.
     *
     * @var string
     */
    protected $identifier;

    /**
     * The credentials secret.
     *
     * @var string
     */
    protected $secret;

    /**
     * {@inheritDoc}
     */
    public function getIdentifier()
    {
        return $this->identifier;
    }

    /**
     * {@inheritDoc}
     */
    public function setIdentifier($identifier)
    {
        $this->identifier = $identifier;
    }

    /**
     * {@inheritDoc}
     */
    public function getSecret()
    {
        return $this->secret;
    }

    /**
     * {@inheritDoc}
     */
    public function setSecret($secret)
    {
        $this->secret = $secret;
    }
}
