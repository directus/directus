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

use League\OAuth2\Client\Tool\RequiredParameterTrait;

/**
 * Represents a type of authorization grant.
 *
 * An authorization grant is a credential representing the resource
 * owner's authorization (to access its protected resources) used by the
 * client to obtain an access token.  OAuth 2.0 defines four
 * grant types -- authorization code, implicit, resource owner password
 * credentials, and client credentials -- as well as an extensibility
 * mechanism for defining additional types.
 *
 * @link http://tools.ietf.org/html/rfc6749#section-1.3 Authorization Grant (RFC 6749, §1.3)
 */
abstract class AbstractGrant
{
    use RequiredParameterTrait;

    /**
     * Returns the name of this grant, eg. 'grant_name', which is used as the
     * grant type when encoding URL query parameters.
     *
     * @return string
     */
    abstract protected function getName();

    /**
     * Returns a list of all required request parameters.
     *
     * @return array
     */
    abstract protected function getRequiredRequestParameters();

    /**
     * Returns this grant's name as its string representation. This allows for
     * string interpolation when building URL query parameters.
     *
     * @return string
     */
    public function __toString()
    {
        return $this->getName();
    }

    /**
     * Prepares an access token request's parameters by checking that all
     * required parameters are set, then merging with any given defaults.
     *
     * @param  array $defaults
     * @param  array $options
     * @return array
     */
    public function prepareRequestParameters(array $defaults, array $options)
    {
        $defaults['grant_type'] = $this->getName();

        $required = $this->getRequiredRequestParameters();
        $provided = array_merge($defaults, $options);

        $this->checkRequiredParameters($required, $provided);

        return $provided;
    }
}
