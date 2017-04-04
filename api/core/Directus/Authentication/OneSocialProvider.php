<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Authentication;

/**
 * Provider for oAuth 1.0
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
abstract class OneSocialProvider extends AbstractSocialProvider
{
    /**
     * @inheritDoc
     */
    public function request()
    {
        // These identify you as a client to the server.
        $temporaryCredentials = $this->provider->getTemporaryCredentials();

        // Store the credentials in the session.
        $session = $this->app->container->get('session');
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
        $get = $this->app->request()->get();
        if (!isset($get['oauth_token']) || !isset($get['oauth_verifier'])) {
            throw new \Exception('Invalid request');
        }

        $session = $this->app->container->get('session');

        // Retrieve the temporary credentials from step 2
        $temporaryCredentials = unserialize($session->get('oauth1cred'));

        // Third and final part to OAuth 1.0 authentication is to retrieve token
        // credentials (formally known as access tokens in earlier OAuth 1.0
        // specs).
        $tokenCredentials = $this->provider->getTokenCredentials($temporaryCredentials, $_GET['oauth_token'], $_GET['oauth_verifier']);

        $user = $this->provider->getUserDetails($tokenCredentials);

        return new SocialUser([
            'email' => $user->email
        ]);
    }
}
