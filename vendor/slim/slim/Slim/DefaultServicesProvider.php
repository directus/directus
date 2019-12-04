<?php
/**
 * Slim Framework (https://slimframework.com)
 *
 * @license https://github.com/slimphp/Slim/blob/3.x/LICENSE.md (MIT License)
 */

namespace Slim;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Handlers\Error;
use Slim\Handlers\NotAllowed;
use Slim\Handlers\NotFound;
use Slim\Handlers\PhpError;
use Slim\Handlers\Strategies\RequestResponse;
use Slim\Http\Environment;
use Slim\Http\Headers;
use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Interfaces\CallableResolverInterface;
use Slim\Interfaces\InvocationStrategyInterface;
use Slim\Interfaces\RouterInterface;

class DefaultServicesProvider
{
    /**
     * Register Slim's default services.
     *
     * @param Container $container A DI container implementing ArrayAccess and psr/container.
     */
    public function register($container)
    {
        if (!isset($container['environment'])) {
            /**
             * This service MUST return a shared instance of \Slim\Http\Environment.
             *
             * @return Environment
             */
            $container['environment'] = function () {
                return new Environment($_SERVER);
            };
        }

        if (!isset($container['request'])) {
            /**
             * PSR-7 Request object
             *
             * @param Container $container
             *
             * @return ServerRequestInterface
             */
            $container['request'] = function ($container) {
                return Request::createFromEnvironment($container->get('environment'));
            };
        }

        if (!isset($container['response'])) {
            /**
             * PSR-7 Response object
             *
             * @param Container $container
             *
             * @return ResponseInterface
             */
            $container['response'] = function ($container) {
                $headers = new Headers(['Content-Type' => 'text/html; charset=UTF-8']);
                $response = new Response(200, $headers);

                return $response->withProtocolVersion($container->get('settings')['httpVersion']);
            };
        }

        if (!isset($container['router'])) {
            /**
             * This service MUST return a shared instance of \Slim\Interfaces\RouterInterface.
             *
             * @param Container $container
             *
             * @return RouterInterface
             */
            $container['router'] = function ($container) {
                $routerCacheFile = false;
                if (isset($container->get('settings')['routerCacheFile'])) {
                    $routerCacheFile = $container->get('settings')['routerCacheFile'];
                }

                $router = (new Router)->setCacheFile($routerCacheFile);
                if (method_exists($router, 'setContainer')) {
                    $router->setContainer($container);
                }

                return $router;
            };
        }

        if (!isset($container['foundHandler'])) {
            /**
             * This service MUST return a SHARED instance InvocationStrategyInterface.
             *
             * @return InvocationStrategyInterface
             */
            $container['foundHandler'] = function () {
                return new RequestResponse;
            };
        }

        if (!isset($container['phpErrorHandler'])) {
            /**
             * This service MUST return a callable that accepts three arguments:
             *
             * 1. Instance of ServerRequestInterface
             * 2. Instance of ResponseInterface
             * 3. Instance of Error
             *
             * The callable MUST return an instance of ResponseInterface.
             *
             * @param Container $container
             *
             * @return callable
             */
            $container['phpErrorHandler'] = function ($container) {
                return new PhpError($container->get('settings')['displayErrorDetails']);
            };
        }

        if (!isset($container['errorHandler'])) {
            /**
             * This service MUST return a callable that accepts three arguments:
             *
             * 1. Instance of \Psr\Http\Message\ServerRequestInterface
             * 2. Instance of \Psr\Http\Message\ResponseInterface
             * 3. Instance of \Exception
             *
             * The callable MUST return an instance of ResponseInterface.
             *
             * @param Container $container
             *
             * @return callable
             */
            $container['errorHandler'] = function ($container) {
                return new Error(
                    $container->get('settings')['displayErrorDetails']
                );
            };
        }

        if (!isset($container['notFoundHandler'])) {
            /**
             * This service MUST return a callable that accepts two arguments:
             *
             * 1. Instance of ServerRequestInterface
             * 2. Instance of ResponseInterface
             *
             * The callable MUST return an instance of ResponseInterface.
             *
             * @return callable
             */
            $container['notFoundHandler'] = function () {
                return new NotFound;
            };
        }

        if (!isset($container['notAllowedHandler'])) {
            /**
             * This service MUST return a callable that accepts three arguments:
             *
             * 1. Instance of ServerRequestInterface
             * 2. Instance of ResponseInterface
             * 3. Array of allowed HTTP methods
             *
             * The callable MUST return an instance of ResponseInterface.
             *
             * @return callable
             */
            $container['notAllowedHandler'] = function () {
                return new NotAllowed;
            };
        }

        if (!isset($container['callableResolver'])) {
            /**
             * Instance of CallableResolverInterface
             *
             * @param Container $container
             *
             * @return CallableResolverInterface
             */
            $container['callableResolver'] = function ($container) {
                return new CallableResolver($container);
            };
        }
    }
}
