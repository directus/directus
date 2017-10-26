<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Authentication;

use League\OAuth2\Client\Token\AccessToken;

/**
 * Provider for oAuth 2.0
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
abstract class TwoSocialProvider extends AbstractSocialProvider
{
    /**
     * @inheritDoc
     */
    public function request()
    {
        $options = [
            'scope' => $this->getScopes()
        ];

        $authUrl = $this->provider->getAuthorizationUrl($options);
        $session = $this->app->container->get('session');
        $session->set('oauth2state', $this->provider->getState());

        header('Location: ' . $authUrl);
        // $this->app->response()->redirect($authUrl);
    }

    /**
     * @inheritdoc
     */
    public function handle()
    {
        $session = $this->app->container->get('session');
        if (empty($_GET['state']) || ($_GET['state'] !== $session->get('oauth2state'))) {

            $session->remove('oauth2state');
            throw new \Exception('Invalid state');
        }

        // Try to get an access token (using the authorization code grant)
        $token = $this->provider->getAccessToken('authorization_code', [
            'code' => $_GET['code']
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
