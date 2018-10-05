<?php
/**
 * Slim Framework (https://slimframework.com)
 *
 * @link      https://github.com/slimphp/Slim
 * @copyright Copyright (c) 2011-2017 Josh Lockhart
 * @license   https://github.com/slimphp/Slim/blob/3.x/LICENSE.md (MIT License)
 */
namespace Slim;

use Psr\Container\ContainerInterface;

/**
 * A routable, middleware-aware object
 *
 * @package Slim
 * @since   3.0.0
 */
abstract class Routable
{
    use CallableResolverAwareTrait;

    /**
     * Route callable
     *
     * @var callable
     */
    protected $callable;

    /**
     * Container
     *
     * @var ContainerInterface
     */
    protected $container;

    /**
     * Route middleware
     *
     * @var callable[]
     */
    protected $middleware = [];

    /**
     * Route pattern
     *
     * @var string
     */
    protected $pattern;

    /**
     * Get the middleware registered for the group
     *
     * @return callable[]
     */
    public function getMiddleware()
    {
        return $this->middleware;
    }

    /**
     * Get the route pattern
     *
     * @return string
     */
    public function getPattern()
    {
        return $this->pattern;
    }

    /**
     * Set container for use with resolveCallable
     *
     * @param ContainerInterface $container
     *
     * @return self
     */
    public function setContainer(ContainerInterface $container)
    {
        $this->container = $container;
        return $this;
    }

    /**
     * Prepend middleware to the middleware collection
     *
     * @param callable|string $callable The callback routine
     *
     * @return static
     */
    public function add($callable)
    {
        $this->middleware[] = new DeferredCallable($callable, $this->container);
        return $this;
    }

    /**
     * Set the route pattern
     *
     * @param string $newPattern
     */
    public function setPattern($newPattern)
    {
        $this->pattern = $newPattern;
    }
}
