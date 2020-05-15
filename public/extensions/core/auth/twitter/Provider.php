<?php

namespace Directus\Authentication\Sso\Provider\twitter;

use Directus\Authentication\Sso\OneSocialProvider;
use League\OAuth1\Client\Server\Twitter;

class Provider extends OneSocialProvider
{
    /**
     * @var Twitter
     */
    protected $provider = null;

    /**
     * Creates the Twitter provider oAuth client
     *
     * @return Twitter
     */
    protected function createProvider()
    {
        $this->provider = new Twitter([
            'identifier'    => $this->config->get('identifier'),
            'secret'        => $this->config->get('secret'),
            'callback_uri'  => $this->getRedirectUrl(),
        ]);

        return $this->provider;
    }

    /**
     * @inheritdoc
     */
    public function getScopes()
    {
        return null;
    }
}
