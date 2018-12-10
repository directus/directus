<?php

namespace Directus\Authentication\Sso\Provider\google;

use Directus\Authentication\Sso\TwoSocialProvider;
use League\OAuth2\Client\Provider\Google;

class Provider extends TwoSocialProvider
{
    /**
     * @var Google
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
     * Creates the Google provider oAuth client
     *
     * @return Google
     */
    protected function createProvider()
    {
        $this->provider = new Google([
            'clientId'          => $this->config->get('client_id'),
            'clientSecret'      => $this->config->get('client_secret'),
            'redirectUri'       => $this->getRedirectUrl(),
            'hostedDomain'      => $this->config->get('hosted_domain'),
            'useOidcMode'       => (bool) $this->config->get('use_oidc_mode'),
        ]);

        return $this->provider;
    }
}
