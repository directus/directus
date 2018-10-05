<?php

namespace Directus\Authentication\Sso;

use Directus\Util\ArrayUtils;

/**
 * Provider for OAuth 1.0
 */
abstract class OneSocialProvider extends AbstractSocialProvider
{
    public function getRequestAuthorizationUrl()
    {
        $options = [];
        $scopes = $this->getScopes();

        if ($scopes) {
            $options['scope'] = $this->getScopes();
        }

        return $this->provider->getAuthorizationUrl($options);
    }

    /**
     * @inheritDoc
     */
    public function request()
    {
        // These identify you as a client to the server.
        $temporaryCredentials = $this->provider->getTemporaryCredentials();

        // Store the credentials in the session.
        $session = $this->container->get('session');
        $session->set('oauth1cred', serialize($temporaryCredentials));

        // resource owner to the login screen on the server.
        $this->provider->authorize($temporaryCredentials);

        return;
    }

    /**
     * @inheritDoc
     */
    public function handle()
    {
        return $this->getUserFromCode([
            'oauth_token' => ArrayUtils::get($_GET, 'oauth_token'),
            'oauth_verifier' => ArrayUtils::get($_GET, 'oauth_verifier')
        ]);
    }

    /**
     * @inheritdoc
     */
    public function getUserFromCode(array $data)
    {
        $oauthToken = ArrayUtils::get($data, 'oauth_token');
        $oauthVerifier = ArrayUtils::get($data, 'oauth_verifier');

        if (!isset($oauthToken) || !isset($oauthVerifier)) {
            throw new \Exception('Invalid request');
        }

        $session = $this->container->get('session');

        // Retrieve the temporary credentials from step 2
        $temporaryCredentials = unserialize($session->get('oauth1cred'));

        // Third and final part to OAuth 1.0 authentication is to retrieve token
        // credentials (formally known as access tokens in earlier OAuth 1.0
        // specs).
        $tokenCredentials = $this->provider->getTokenCredentials($temporaryCredentials, $oauthToken, $oauthVerifier);

        $user = $this->provider->getUserDetails($tokenCredentials);

        return new SocialUser([
            'email' => $user->email
        ]);
    }

    /**
     * Get the list of scopes for the current service
     *
     * @return array
     */
    abstract public function getScopes();
}
