<?php

namespace Directus\Authentication\Sso\Provider\github;

use Directus\Authentication\Sso\TwoSocialProvider;
use Directus\Util\ArrayUtils;
use League\OAuth2\Client\Provider\Github;
use League\OAuth2\Client\Token\AccessToken;

class Provider extends TwoSocialProvider
{
    /**
     * @var Github
     */
    protected $provider = null;

    /**
     * @inheritdoc
     */
    public function getScopes()
    {
        return [
            'user:email'
        ];
    }

    /**
     * @inheritdoc
     */
    protected function getResourceOwnerEmail(AccessToken $token)
    {
        $provider = $this->provider;
        $ownerEmail = null;
        $visible = [];
        $primary = null;

        $url = $this->getResourceOwnerEmailUrl($token);
        $request = $provider->getAuthenticatedRequest($provider::METHOD_GET, $url, $token);
        $response = $provider->getParsedResponse($request);

        // Remove non-verified emails
        $response = array_filter($response, function ($item) {
            return ArrayUtils::get($item, 'verified') === true;
        });

        if (is_array($response) && count($response) > 0) {
            // fallback to the first email on the list
            $ownerEmail = $response[0]['email'];

            foreach ($response as $emailData) {
                $email = ArrayUtils::get($emailData, 'email');

                if (ArrayUtils::get($emailData, 'primary', false)) {
                    $primary = $email;
                }

                if (ArrayUtils::get($emailData, 'visibility') === 'public') {
                    $visible[] = $email;
                }
            }
        }

        // First try: pick primary email if it's visible
        // Second try: pick the first visible email
        // Third try: pick the primary email if exists
        // Fourth try: pick the first email on the list
        // Fifth try: fallback to null
        if (in_array($primary, $visible)) {
            $ownerEmail = $primary;
        } else if (count($visible) > 0) {
            $ownerEmail = array_shift($visible);
        } else if ($primary) {
            $ownerEmail = $primary;
        }

        return $ownerEmail;
    }

    /**
     * Gets the resource owner email url
     *
     * @param AccessToken $token
     *
     * @return string
     */
    protected function getResourceOwnerEmailUrl(AccessToken $token)
    {
        if ($this->provider->domain === 'https://github.com') {
            $url = $this->provider->apiDomain . '/user/emails';
        } else {
            $url = $this->provider->domain . '/api/v3/user/emails';
        }

        return $url;
    }

    /**
     * Creates the GitHub provider oAuth client
     *
     * @return Github
     */
    protected function createProvider()
    {
        $this->provider = new Github([
            'clientId'          => $this->config->get('client_id'),
            'clientSecret'      => $this->config->get('client_secret'),
            'redirectUri'       => $this->getRedirectUrl(),
        ]);

        return $this->provider;
    }
}
