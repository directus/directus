<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Authentication;

use Directus\Util\ArrayUtils;

/**
 * Social Providers container
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class Social
{
    /**
     * Register providers
     *
     * @var array
     */
    protected $providers = [];

    public function __construct($providers = [])
    {
        $this->register($providers);
    }

    /**
     * Register a provider
     *
     * @param $providers
     *
     * @return $this
     */
    public function register($providers)
    {
        if (!is_array($providers)) {
            $providers = [$providers];
        }

        foreach($providers as $provider) {
            $name = $provider->getName();

            if (!$name || !is_string($name)) {
                throw new \RuntimeException('Social Login name must be a string');
            }

            if (ArrayUtils::has($this->providers, $name)) {
                throw new \RuntimeException(sprintf('Social Login "%s" already exists', $name));
            }

            $this->providers[$name] = $provider;
        }

        return $this;
    }

    /**
     * Gets a provider by its key
     *
     * @param $key
     *
     * @throws \Exception
     *
     * @return mixed|null
     */
    public function get($key)
    {
        if (!array_key_exists($key, $this->providers)) {
            throw new \Exception(sprintf('auth provider "%s" does not exist.', $key));
        }

        return $this->providers[$key];
    }

    /**
     * Checks whether the given service name is supported
     *
     * @param $name
     *
     * @return bool
     */
    public static function isSupported($name)
    {
        return in_array($name, static::supported());
    }

    /**
     * List of supported services
     *
     * @return array
     */
    public static function supported()
    {
        return [
            'google',
            'facebook',
            'twitter',
            'github'
        ];
    }
}
