<?php
/**
 * Slim Framework (https://slimframework.com)
 *
 * @license https://github.com/slimphp/Slim/blob/3.x/LICENSE.md (MIT License)
 */

namespace Slim;

use Closure;
use Psr\Container\ContainerInterface;

class DeferredCallable
{
    use CallableResolverAwareTrait;

    /**
     * @var callable|string
     */
    private $callable;

    /**
     * @var ContainerInterface
     */
    private $container;

    /**
     * @param callable|string $callable
     * @param ContainerInterface $container
     */
    public function __construct($callable, ContainerInterface $container = null)
    {
        $this->callable = $callable;
        $this->container = $container;
    }

    /**
     * @return callable|string
     */
    public function getCallable()
    {
        return $this->callable;
    }

    /**
     * @return mixed
     */
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
