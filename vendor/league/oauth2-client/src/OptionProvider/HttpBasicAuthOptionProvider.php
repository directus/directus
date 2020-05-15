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

namespace League\OAuth2\Client\OptionProvider;

use InvalidArgumentException;

/**
 * Add http basic auth into access token request options
 * @link https://tools.ietf.org/html/rfc6749#section-2.3.1
 */
class HttpBasicAuthOptionProvider extends PostAuthOptionProvider
{
    /**
     * @inheritdoc
     */
    public function getAccessTokenOptions($method, array $params)
    {
        if (empty($params['client_id']) || empty($params['client_secret'])) {
            throw new InvalidArgumentException('clientId and clientSecret are required for http basic auth');
        }

        $encodedCredentials = base64_encode(sprintf('%s:%s', $params['client_id'], $params['client_secret']));
        unset($params['client_id'], $params['client_secret']);

        $options = parent::getAccessTokenOptions($method, $params);
        $options['headers']['Authorization'] = 'Basic ' . $encodedCredentials;

        return $options;
    }
}
