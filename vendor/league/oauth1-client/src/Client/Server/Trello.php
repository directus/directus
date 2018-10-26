<?php

namespace League\OAuth1\Client\Server;

use League\OAuth1\Client\Credentials\TokenCredentials;

class Trello extends Server
{
    /**
     * Access token.
     *
     * @var string
     */
    protected $accessToken;

    /**
     * Application expiration.
     *
     * @var string
     */
    protected $applicationExpiration;

    /**
     * Application key.
     *
     * @var string
     */
    protected $applicationKey;

    /**
     * Application name.
     *
     * @var string
     */
    protected $applicationName;

    /**
     * Application scope.
     *
     * @var string
     */
    protected $applicationScope;

    /**
     * {@inheritDoc}
     */
    public function __construct($clientCredentials, SignatureInterface $signature = null)
    {
        parent::__construct($clientCredentials, $signature);

        if (is_array($clientCredentials)) {
            $this->parseConfiguration($clientCredentials);
        }
    }

    /**
     * Set the access token.
     *
     * @param string $accessToken
     *
     * @return Trello
     */
    public function setAccessToken($accessToken)
    {
        $this->accessToken = $accessToken;

        return $this;
    }

    /**
     * Set the application expiration.
     *
     * @param string $applicationExpiration
     *
     * @return Trello
     */
    public function setApplicationExpiration($applicationExpiration)
    {
        $this->applicationExpiration = $applicationExpiration;

        return $this;
    }

    /**
     * Get application expiration.
     *
     * @return string
     */
    public function getApplicationExpiration()
    {
        return $this->applicationExpiration ?: '1day';
    }

    /**
     * Set the application name.
     *
     * @param string $applicationName
     *
     * @return Trello
     */
    public function setApplicationName($applicationName)
    {
        $this->applicationName = $applicationName;

        return $this;
    }

    /**
     * Get application name.
     *
     * @return string|null
     */
    public function getApplicationName()
    {
        return $this->applicationName ?: null;
    }

    /**
     * Set the application scope.
     *
     * @param string $applicationScope
     *
     * @return Trello
     */
    public function setApplicationScope($applicationScope)
    {
        $this->applicationScope = $applicationScope;

        return $this;
    }

    /**
     * Get application scope.
     *
     * @return string
     */
    public function getApplicationScope()
    {
        return $this->applicationScope ?: 'read';
    }

    /**
     * {@inheritDoc}
     */
    public function urlTemporaryCredentials()
    {
        return 'https://trello.com/1/OAuthGetRequestToken';
    }

    /**
     * {@inheritDoc}
     */
    public function urlAuthorization()
    {
        return 'https://trello.com/1/OAuthAuthorizeToken?'.
            $this->buildAuthorizationQueryParameters();
    }

    /**
     * {@inheritDoc}
     */
    public function urlTokenCredentials()
    {
        return 'https://trello.com/1/OAuthGetAccessToken';
    }

    /**
     * {@inheritDoc}
     */
    public function urlUserDetails()
    {
        return 'https://trello.com/1/members/me?key='.$this->applicationKey.'&token='.$this->accessToken;
    }

    /**
     * {@inheritDoc}
     */
    public function userDetails($data, TokenCredentials $tokenCredentials)
    {
        $user = new User();

        $user->nickname = $data['username'];
        $user->name = $data['fullName'];
        $user->imageUrl = null;

        $user->extra = (array) $data;

        return $user;
    }

    /**
     * {@inheritDoc}
     */
    public function userUid($data, TokenCredentials $tokenCredentials)
    {
        return $data['id'];
    }

    /**
     * {@inheritDoc}
     */
    public function userEmail($data, TokenCredentials $tokenCredentials)
    {
        return;
    }

    /**
     * {@inheritDoc}
     */
    public function userScreenName($data, TokenCredentials $tokenCredentials)
    {
        return $data['username'];
    }

    /**
     * Build authorization query parameters.
     *
     * @return string
     */
    private function buildAuthorizationQueryParameters()
    {
        $params = array(
            'response_type' => 'fragment',
            'scope' => $this->getApplicationScope(),
            'expiration' => $this->getApplicationExpiration(),
            'name' => $this->getApplicationName(),
        );

        return http_build_query($params);
    }

    /**
     * Parse configuration array to set attributes.
     *
     * @param array $configuration
     */
    private function parseConfiguration(array $configuration = array())
    {
        $configToPropertyMap = array(
            'identifier' => 'applicationKey',
            'expiration' => 'applicationExpiration',
            'name' => 'applicationName',
            'scope' => 'applicationScope',
        );

        foreach ($configToPropertyMap as $config => $property) {
            if (isset($configuration[$config])) {
                $this->$property = $configuration[$config];
            }
        }
    }
}
