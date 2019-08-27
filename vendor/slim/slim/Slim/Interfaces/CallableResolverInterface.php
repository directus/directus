<?php
/**
 * Slim Framework (https://slimframework.com)
 *
 * @license https://github.com/slimphp/Slim/blob/3.x/LICENSE.md (MIT License)
 */

namespace Slim\Interfaces;

use RuntimeException;

interface CallableResolverInterface
{
    /**
     * Invoke the resolved callable.
     *
     * @param callable|string $toResolve
     *
     * @return callable
     *
     * @throws RuntimeException
     */
    public function resolve($toResolve);
}
