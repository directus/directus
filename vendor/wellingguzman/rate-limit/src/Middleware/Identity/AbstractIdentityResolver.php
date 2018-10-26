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

/**
 * @author Nikola Posa <posa.nikola@gmail.com>
 */
abstract class AbstractIdentityResolver implements IdentityResolverInterface
{
    protected static function getDefaultIdentity(RequestInterface $request)
    {
        return sha1(implode('|', [
            $request->getMethod(),
            $request->getUri()->getPath(),
        ]));
    }
}
