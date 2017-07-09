<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Authentication;

use League\OAuth1\Client\Server\Twitter;

/**
 * Twitter Login provider
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class TwitterProvider extends OneSocialProvider
{
    /**
     * @var Twitter
     */
    protected $provider = null;

    /**
     * @inheritDoc
     */
    public function getName()
    {
        return 'twitter';
    }

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
            'callback_uri'  => $this->getRedirectUrl($this->getName()),
        ]);

        return $this->provider;
    }
}
