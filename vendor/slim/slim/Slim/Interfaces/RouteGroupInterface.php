<?php
/**
 * Slim Framework (https://slimframework.com)
 *
 * @link      https://github.com/slimphp/Slim
 * @copyright Copyright (c) 2011-2017 Josh Lockhart
 * @license   https://github.com/slimphp/Slim/blob/3.x/LICENSE.md (MIT License)
 */
namespace Slim\Interfaces;

use Slim\App;

/**
 * RouteGroup Interface
 *
 * @package Slim
 * @since   3.0.0
 */
interface RouteGroupInterface
{
    /**
     * Get route pattern
     *
     * @return string
     */
    public function getPattern();

    /**
     * Prepend middleware to the group middleware collection
     *
     * @param callable|string $callable The callback routine
     *
     * @return RouteGroupInterface
     */
    public function add($callable);

    /**
     * Execute route group callable in the context of the Slim App
     *
     * This method invokes the route group object's callable, collecting
     * nested route objects
     *
     * @param App $app
     */
    public function __invoke(App $app);
}
