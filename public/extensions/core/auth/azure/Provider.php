<?php
namespace Directus\Authentication\Sso\Provider\azure;

use Directus\Authentication\Sso\TwoSocialProvider;
use TheNetworg\OAuth2\Client\Provider\Azure;

class Provider extends TwoSocialProvider
{
    protected $provider = null;

    public function getScopes()
    {
        return ['email'];
    }

    /**
     * Creates the Azure provider oAuth client
     */
    protected function createProvider()
    {
        $this->provider = new Azure([
            'clientId'          => $this->config->get('client_id'),
            'clientSecret'      => $this->config->get('client_secret'),
        ]);
        return $this->provider;
    }

    protected function getResourceOwnerEmail(\League\OAuth2\Client\Token\AccessToken $token)
    {
        $user = $this->provider->getResourceOwner($token);
        return $user->getUpn();
    }
}
