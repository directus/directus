<?php

namespace Directus\Application;

use Directus\Application\ErrorHandlers\MethodNotAllowedHandler;
use Directus\Application\ErrorHandlers\NotFoundHandler;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Http\Headers;

class DefaultServicesProvider extends \Slim\DefaultServicesProvider
{
    /**
     * Register Slim's default services.
     *
     * @param Container $container A DI container implementing ArrayAccess and container-interop.
     */
    public function register($container)
    {
        /**
         * @param Container $container
         *
         * @return ServerRequestInterface
         */
        $container['request'] = function ($container) {
            return  Request::createFromEnvironment($container->get('environment'));
        };

        /**
         * @param Container $container
         *
         * @return ResponseInterface
         */
        $container['response'] = function ($container) {
            $headers = new Headers(['Content-Type' => 'text/html; charset=UTF-8']);
            $response = new Response(200, $headers);

            return $response->withProtocolVersion($container->get('settings')['httpVersion']);
        };

        if (!isset($container['notFoundHandler'])) {
            $container['notFoundHandler'] = function () use ($container) {
                return new NotFoundHandler($container['hook_emitter']);
            };
        }

        if (!isset($container['notAllowedHandler'])) {
            $container['notAllowedHandler'] = function () use ($container) {
                return new MethodNotAllowedHandler($container['hook_emitter']);
            };
        }

        parent::register($container);
    }
}
