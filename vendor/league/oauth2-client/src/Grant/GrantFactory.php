<?php
/**
 * This file is part of the league/oauth2-client library
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 *
 * @copyright Copyright (c) Alex Bilbie <hello@alexbilbie.com>
 * @license http://opensource.org/licenses/MIT MIT
 * @link http://thephpleague.com/oauth2-client/ Documentation
 * @link https://packagist.org/packages/league/oauth2-client Packagist
 * @link https://github.com/thephpleague/oauth2-client GitHub
 */

namespace League\OAuth2\Client\Grant;

use League\OAuth2\Client\Grant\Exception\InvalidGrantException;

/**
 * Represents a factory used when retrieving an authorization grant type.
 */
class GrantFactory
{
    /**
     * @var array
     */
    protected $registry = [];

    /**
     * Defines a grant singleton in the registry.
     *
     * @param  string $name
     * @param  AbstractGrant $grant
     * @return self
     */
    public function setGrant($name, AbstractGrant $grant)
    {
        $this->registry[$name] = $grant;

        return $this;
    }

    /**
     * Returns a grant singleton by name.
     *
     * If the grant has not be registered, a default grant will be loaded.
     *
     * @param  string $name
     * @return AbstractGrant
     */
    public function getGrant($name)
    {
        if (empty($this->registry[$name])) {
            $this->registerDefaultGrant($name);
        }

        return $this->registry[$name];
    }

    /**
     * Registers a default grant singleton by name.
     *
     * @param  string $name
     * @return self
     */
    protected function registerDefaultGrant($name)
    {
        // PascalCase the grant. E.g: 'authorization_code' becomes 'AuthorizationCode'
        $class = str_replace(' ', '', ucwords(str_replace(['-', '_'], ' ', $name)));
        $class = 'League\\OAuth2\\Client\\Grant\\' . $class;

        $this->checkGrant($class);

        return $this->setGrant($name, new $class);
    }

    /**
     * Determines if a variable is a valid grant.
     *
     * @param  mixed $class
     * @return boolean
     */
    public function isGrant($class)
    {
        return is_subclass_of($class, AbstractGrant::class);
    }

    /**
     * Checks if a variable is a valid grant.
     *
     * @throws InvalidGrantException
     * @param  mixed $class
     * @return void
     */
    public function checkGrant($class)
    {
        if (!$this->isGrant($class)) {
            throw new InvalidGrantException(sprintf(
                'Grant "%s" must extend AbstractGrant',
                is_object($class) ? get_class($class) : $class
            ));
        }
    }
}
