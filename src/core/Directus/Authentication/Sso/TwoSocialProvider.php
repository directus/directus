<?php

namespace Directus\Authentication\Sso;

use Directus\Util\ArrayUtils;
use League\OAuth2\Client\Token\AccessToken;

abstract class TwoSocialProvider extends AbstractSocialProvider
{
    /**
     * @inheritDoc
     */
    public function getRequestAuthorizationUrl()
    {
        $options = [
            'scope' => $this->getScopes()
        ];

        return $this->provider->getAuthorizationUrl($options);
    }

    /**
     * @inheritDoc
     */
    public function request()
    {
        $requestUrl = $this->getRequestAuthorizationUrl();

        header('Location: ' . $requestUrl);
    }

    /**
     * @inheritdoc
     */
    public function handle()
    {
        return $this->getUserFromCode([
            'code' => ArrayUtils::get($_GET, 'code')
        ]);
    }

    /**
     * @inheritdoc
     */
    public function getUserFromCode(array $data)
    {
        // Try to get an access token (using the authorization code grant)
        $token = $this->provider->getAccessToken('authorization_code', [
            'code' => ArrayUtils::get($data, 'code')
        ]);

        return new SocialUser([
            'email' => $this->getResourceOwnerEmail($token)
        ]);
    }

    /**
     * Gets the resource owner email
     *
     * @param AccessToken $token
     *
     * @return string
     */
    protected function getResourceOwnerEmail(AccessToken $token)
    {
        $user = $this->provider->getResourceOwner($token);

        return $user->getEmail();
    }

    /**
     * Get the list of scopes for the current service
     *
     * @return array
     */
    abstract public function getScopes();
}
