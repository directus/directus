<?php
/**
 * Slim Framework (https://slimframework.com)
 *
 * @link      https://github.com/slimphp/Slim
 * @copyright Copyright (c) 2011-2017 Josh Lockhart
 * @license   https://github.com/slimphp/Slim/blob/3.x/LICENSE.md (MIT License)
 */
namespace Slim\Interfaces;

use RuntimeException;
use InvalidArgumentException;
use Psr\Http\Message\ServerRequestInterface;

/**
 * Router Interface
 *
 * @package Slim
 * @since   3.0.0
 */
interface RouterInterface
{
    // array keys from route result
    const DISPATCH_STATUS = 0;
    const ALLOWED_METHODS = 1;

    /**
     * Add route
     *
     * @param string[] $methods Array of HTTP methods
     * @param string   $pattern The route pattern
     * @param callable $handler The route callable
     *
     * @return RouteInterface
     */
    public function map($methods, $pattern, $handler);

    /**
     * Dispatch router for HTTP request
     *
     * @param  ServerRequestInterface $request The current HTTP request object
     *
     * @return array
     *
     * @link   https://github.com/nikic/FastRoute/blob/master/src/Dispatcher.php
     */
    public function dispatch(ServerRequestInterface $request);

    /**
     * Add a route group to the array
     *
     * @param string   $pattern The group pattern
     * @param callable $callable A group callable
     *
     * @return RouteGroupInterface
     */
    public function pushGroup($pattern, $callable);

    /**
     * Removes the last route group from the array
     *
     * @return bool True if successful, else False
     */
    public function popGroup();

    /**
     * Get named route object
     *
     * @param string $name        Route name
     *
     * @return \Slim\Interfaces\RouteInterface
     *
     * @throws RuntimeException   If named route does not exist
     */
    public function getNamedRoute($name);

    /**
     * @param $identifier
     *
     * @return \Slim\Interfaces\RouteInterface
     */
    public function lookupRoute($identifier);

    /**
     * Build the path for a named route excluding the base path
     *
     * @param string $name        Route name
     * @param array  $data        Named argument replacement data
     * @param array  $queryParams Optional query string parameters
     *
     * @return string
     *
     * @throws RuntimeException         If named route does not exist
     * @throws InvalidArgumentException If required data not provided
     */
    public function relativePathFor($name, array $data = [], array $queryParams = []);

    /**
     * Build the path for a named route including the base path
     *
     * @param string $name        Route name
     * @param array  $data        Named argument replacement data
     * @param array  $queryParams Optional query string parameters
     *
     * @return string
     *
     * @throws RuntimeException         If named route does not exist
     * @throws InvalidArgumentException If required data not provided
     */
    public function pathFor($name, array $data = [], array $queryParams = []);
}
