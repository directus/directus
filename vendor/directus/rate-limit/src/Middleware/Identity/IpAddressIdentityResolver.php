<?php
/**
 * This file is part of the Rate Limit package.
 *
 * Copyright (c) Nikola Posa
 *
 * For full copyright and license information, please refer to the LICENSE file,
 * located at the package root folder.
 */

namespace RateLimit\Middleware\Identity;

use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * @author Nikola Posa <posa.nikola@gmail.com>
 */
final class IpAddressIdentityResolver extends AbstractIdentityResolver
{
    /**
     * {@inheritdoc}
     */
    public function getIdentity(RequestInterface $request)
    {
        if (!$request instanceof ServerRequestInterface) {
            return self::getDefaultIdentity($request);
        }

        $serverParams = $request->getServerParams();

        if (array_key_exists('HTTP_CLIENT_IP', $serverParams)) {
            return $serverParams['HTTP_CLIENT_IP'];
        }

        if (array_key_exists('HTTP_X_FORWARDED_FOR', $serverParams)) {
            return $serverParams['HTTP_X_FORWARDED_FOR'];
        }

        return isset($serverParams['REMOTE_ADDR'])
                ? $serverParams['REMOTE_ADDR']
                : self::getDefaultIdentity($request);
    }
}
