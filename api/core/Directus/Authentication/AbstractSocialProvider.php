<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Authentication;

use Directus\Application\Application;
use Directus\Config\Config;

/**
 * @author Welling Guzmán <welling@rngr.org>
 */
abstract class AbstractSocialProvider implements SocialProviderInterface
{
    /**
     * @var Application
     */
    protected $app;

    /**
     * @var Config
     */
    protected $config;

    /**
     * @var mixed
     */
    protected $provider = null;

    /**
     * @var string
     */
    protected $token = null;

    public function __construct(Application $app, array $config)
    {
        $this->app = $app;
        $this->config = new Config($config);

        $this->createProvider();
    }

    /**
     * Gets provider instance
     *
     * @return mixed
     */
    public function getProvider()
    {
        if (!$this->provider) {
            $this->createProvider();
        }

        return $this->provider;
    }

    /**
     * Gets authorization token
     *
     * @return string|null
     */
    public function getToken()
    {
        return $this->token;
    }

    /**
     * Gets the redirect url for the given service name
     *
     * @param $name
     *
     * @return string
     */
    public function getRedirectUrl($name)
    {
        $request = Application::getInstance()->request();

        return rtrim($request->getUrl(), '/') . '/auth/' . $name . '/receive';
    }

    /**
     * Creates the provider oAuth client
     *
     * @return mixed
     */
    abstract protected function createProvider();
}
