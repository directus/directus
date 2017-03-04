<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2016 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Authentication;

use League\OAuth2\Client\Provider\Github;

/**
 * GitHub Social Login provider
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class GitHubProvider extends TwoSocialProvider
{
    /**
     * @var Github
     */
    protected $provider = null;

    /**
     * @inheritDoc
     */
    public function getName()
    {
        return 'github';
    }

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
     * Creates the GitHub provider oAuth client
     *
     * @return Github
     */
    protected function createProvider()
    {
        $this->provider = new Github([
            'clientId'          => $this->config->get('client_id'),
            'clientSecret'      => $this->config->get('client_secret'),
            'redirectUri'       => $this->getRedirectUrl($this->getName()),
        ]);

        return $this->provider;
    }
}
