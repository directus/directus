<?php

namespace Directus\Authentication\Sso\Provider\okta;

use Directus\Authentication\Sso\TwoSocialProvider;
use WellingGuzman\OAuth2\Client\Provider\Okta;

class Provider extends TwoSocialProvider
{
    /**
     * @var Okta
     */
    protected $provider = null;

    /**
     * @inheritdoc
     */
    public function getScopes()
    {
        return ['openid email'];
    }

    /**
     * Creates the GitHub provider oAuth client
     *
     * @return Okta
     */
    protected function createProvider()
    {
        $this->provider = new Okta([
            'baseUrl'           => $this->config->get('base_url'),
            'clientId'          => $this->config->get('client_id'),
            'clientSecret'      => $this->config->get('client_secret'),
            'redirectUri'       => $this->getRedirectUrl()
        ]);

        return $this->provider;
    }
}
