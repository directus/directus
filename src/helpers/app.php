<?php

namespace Directus;

use Directus\Api\Routes\Projects;
use Directus\Application\Application;
use Directus\Application\ErrorHandlers\NotInstalledNotFoundHandler;
use Directus\Application\Http\Middleware\CorsMiddleware;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Collection\Collection;
use Directus\Exception\Exception;
use Slim\Http\Body;

if (!function_exists('create_app'))  {
    /**
     * Creates an api application
     *
     * @param string $basePath
     * @param array $config
     * @param array $values
     *
     * @return \Directus\Application\Application
     */
    function create_app($basePath, array $config, array $values = [])
    {
        return new Application(
            $basePath,
            $config,
            $values
        );
    }
}

if (!function_exists('create_app_with_project_name')) {
    /**
     * Creates an api application with the given environment
     *
     * @param $basePath
     * @param $name
     * @param array $values
     *
     * @return \Directus\Application\Application
     *
     * @throws Exception
     */
    function create_app_with_project_name($basePath, $name, array $values = [])
    {
        $configPath = $basePath . '/config';
        $configFilePath = $configPath . '/api.php';

        if (!empty($name) && $name !== '_') {
            $configFilePath = sprintf('%s/api.%s.php', $configPath, $name);
        }

        if (!file_exists($configFilePath)) {
            throw new Exception('Unknown environment: ' . $name);
        }

        return create_app($basePath, require $configFilePath);
    }
}

if (!function_exists('ping_route')) {
    /**
     * Returns a ping route
     *
     * @param \Directus\Application\Application $app
     *
     * @return \Closure
     */
    function ping_route(Application $app)
    {
        return function (Request $request, Response $response) {
            /** @var \Directus\Container\Container $container */
            $container = $this;
            $settings = $container->has('settings') ? $container->get('settings') : new Collection();

            if ($settings->get('env', 'development') === 'production') {
                $response = $response->withStatus(404);
            } else {
                $body = new Body(fopen('php://temp', 'r+'));
                $body->write('pong');
                $response = $response->withBody($body);
            }

            return $response;
        };
    }
}

if (!function_exists('create_ping_route')) {
    /**
     * Create a new ping the server route
     *
     * @param Application $app
     *
     * @return Application
     */
    function create_ping_route(Application $app)
    {
        /**
         * Ping the server
         */
        $app->get('/ping', ping_route($app))
            ->add(new CorsMiddleware($app->getContainer(), true))
            ->setName('server_ping');

        return $app;
    }
}

if (!function_exists('create_install_route')) {
    /**
     * Create a new install route
     *
     * @param Application $app
     *
     * @return Application
     */
    function create_install_route(Application $app)
    {
        $app->group('/projects', Projects::class);

        return $app;
    }
}

if (!function_exists('create_ping_server')) {
    /**
     * Creates a simple app
     *
     * @param string $basePath
     * @param array $config
     * @param array $values
     *
     * @return Application
     */
    function create_ping_server($basePath, array $config = [], array $values = [])
    {
        $app = create_app($basePath, array_merge([
            'app' => [
                'env' => 'production'
            ]
        ], $config), $values);

        $app->group('/server', function () {
            create_ping_route($this);
        });

        return $app;
    }
}

if (!function_exists('create_default_app')) {
    /**
     * Creates a simple app
     *
     * @param string $basePath
     * @param array $config
     *
     * @return Application
     */
    function create_default_app($basePath, array $config = [])
    {
        $values['notFoundHandler'] = function () {
            return new NotInstalledNotFoundHandler();
        };

        $app = create_app($basePath, array_merge([
            'app' => [
                'env' => 'production'
            ]
        ], $config), $values);

        $app->add(new CorsMiddleware($app->getContainer(), true));

        $app->group('/server', function () {
            create_ping_route($this);
        });
        create_install_route($app);

        return $app;
    }
}

if (!function_exists('ping_server')) {
    /**
     * Ping the API Server
     *
     * @return bool
     */
    function ping_server()
    {
        // @TODO: Fix error when the route exists but there's an error
        // It will not return "pong" back
        $response = @file_get_contents(get_url('/api/ping'));

        return $response === 'pong';
    }
}
