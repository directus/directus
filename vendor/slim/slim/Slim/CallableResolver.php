<?php
/**
 * Slim Framework (https://slimframework.com)
 *
 * @license https://github.com/slimphp/Slim/blob/3.x/LICENSE.md (MIT License)
 */

namespace Slim;

use Psr\Container\ContainerInterface;
use RuntimeException;
use Slim\Interfaces\CallableResolverInterface;

/**
 * This class resolves a string of the format 'class:method' into a closure
 * that can be dispatched.
 */
final class CallableResolver implements CallableResolverInterface
{
    const CALLABLE_PATTERN = '!^([^\:]+)\:([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)$!';

    /**
     * @var ContainerInterface
     */
    private $container;

    /**
     * @param ContainerInterface $container
     */
    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }

    /**
     * Resolve toResolve into a closure so that the router can dispatch.
     *
     * If toResolve is of the format 'class:method', then try to extract 'class'
     * from the container otherwise instantiate it and then dispatch 'method'.
     *
     * @param callable|string $toResolve
     *
     * @return callable
     *
     * @throws RuntimeException If the callable does not exist
     * @throws RuntimeException If the callable is not resolvable
     */
    public function resolve($toResolve)
    {
        if (is_callable($toResolve)) {
            return $toResolve;
        }

        $resolved = $toResolve;

        if (is_string($toResolve)) {
            list($class, $method) = $this->parseCallable($toResolve);
            $resolved = $this->resolveCallable($class, $method);
        }

        $this->assertCallable($resolved);
        return $resolved;
    }

    /**
     * Extract class and method from toResolve
     *
     * @param string $toResolve
     *
     * @return array
     */
    protected function parseCallable($toResolve)
    {
        if (preg_match(self::CALLABLE_PATTERN, $toResolve, $matches)) {
            return [$matches[1], $matches[2]];
        }

        return [$toResolve, '__invoke'];
    }

    /**
     * Check if string is something in the DIC
     * that's callable or is a class name which has an __invoke() method.
     *
     * @param string $class
     * @param string $method
     *
     * @return callable
     *
     * @throws RuntimeException if the callable does not exist
     */
    protected function resolveCallable($class, $method)
    {
        if ($this->container->has($class)) {
            return [$this->container->get($class), $method];
        }

        if (!class_exists($class)) {
            throw new RuntimeException(sprintf('Callable %s does not exist', $class));
        }

        return [new $class($this->container), $method];
    }

    /**
     * @param Callable $callable
     *
     * @throws RuntimeException if the callable is not resolvable
     */
    protected function assertCallable($callable)
    {
        if (!is_callable($callable)) {
            throw new RuntimeException(sprintf(
                '%s is not resolvable',
                is_array($callable) || is_object($callable) ? json_encode($callable) : $callable
            ));
        }
    }
}
