<?php
/**
 * Slim Framework (https://slimframework.com)
 *
 * @link      https://github.com/slimphp/Slim
 * @copyright Copyright (c) 2011-2017 Josh Lockhart
 * @license   https://github.com/slimphp/Slim/blob/3.x/LICENSE.md (MIT License)
 */

namespace Slim;

use Closure;
use Psr\Container\ContainerInterface;

class DeferredCallable
{
    use CallableResolverAwareTrait;

    private $callable;
    /** @var  ContainerInterface */
    private $container;

    /**
     * DeferredMiddleware constructor.
     * @param callable|string $callable
     * @param ContainerInterface $container
     */
    public function __construct($callable, ContainerInterface $container = null)
    {
        $this->callable = $callable;
        $this->container = $container;
    }

    public function __invoke()
    {
        $callable = $this->resolveCallable($this->callable);
        if ($callable instanceof Closure) {
            $callable = $callable->bindTo($this->container);
        }

        $args = func_get_args();

        return call_user_func_array($callable, $args);
    }
}
