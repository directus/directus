<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Authentication;

use League\OAuth2\Client\Provider\Facebook;

/**
 * Facebook Social Login provider
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class FacebookProvider extends TwoSocialProvider
{
    /**
     * @var Facebook
     */
    protected $provider = null;

    /**
     * @inheritDoc
     */
    public function getName()
    {
        return 'facebook';
    }

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
            'redirectUri'       => $this->getRedirectUrl($this->getName()),
            'graphApiVersion'   => $this->config->get('graph_api_version'),
        ]);

        return $this->provider;
    }
}
