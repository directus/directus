<?php

namespace Directus\Authentication\Sso\Provider\facebook;

use Directus\Authentication\Sso\TwoSocialProvider;
use League\OAuth2\Client\Provider\Facebook;

class Provider extends TwoSocialProvider
{
    /**
     * @var Facebook
     */
    protected $provider = null;

    /**
     * @inheritdoc
     */
    public function getScopes()
    {
        return [
            'email'
        ];
    }

    /**
     * Creates the facebook provider oAuth client
     *
     * @return Facebook
     */
    protected function createProvider()
    {
        $this->provider = new Facebook([
            'clientId'          => $this->config->get('client_id'),
            'clientSecret'      => $this->config->get('client_secret'),
            'redirectUri'       => $this->getRedirectUrl(),
            'graphApiVersion'   => $this->config->get('graph_api_version'),
        ]);

        return $this->provider;
    }
}
