<?php

namespace Directus;

use Directus\Api\Routes\ProjectsCreate;
use Directus\Application\Application;
use Directus\Application\ErrorHandlers\NotInstalledNotFoundHandler;
use Directus\Application\Http\Middleware\CorsMiddleware;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Collection\Collection;
use Directus\Config\Config;
use Directus\Config\Context;
use Directus\Config\Schema\Schema;
use Directus\Config\Exception\UnknownProjectException;
use Directus\Exception\Exception;
use Directus\Exception\UnauthorizedException;
use Directus\Util\Installation\InstallerUtils;
use Directus\Util\StringUtils;
use Slim\Http\Body;

if (!function_exists('create_app')) {
    /**
     * Creates an api application.
     *
     * @param string $basePath
     * @param array  $config
     * @param array  $values
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
     * Creates an api application with the given environment.
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
        return create_app($basePath, get_project_config($name, $basePath)->toArray(), $values);
    }
}

if (!function_exists('get_project_config')) {
    /**
     * Returns the configuration for a given project.
     *
     * @param string|null $name
     * @param string|null $basePath
     *
     * @return Config
     *
     * @throws Exception
     */
    function get_project_config($name, $basePath = null)
    {
        static $configs = [];

        if ($basePath === null) {
            $basePath = get_app_base_path();
        }

        $configFilePath = InstallerUtils::createConfigPath($basePath, $name);

        if (isset($configs[$configFilePath])) {
            return $configs[$configFilePath];
        }

        $config = [];
        $schema = Schema::get();

        if (Context::is_env()) {
            $configFilePath = '__env__';
            $configData = $schema->value(Context::from_env());
        } else {
            if (!file_exists($configFilePath)) {
                throw new UnknownProjectException($name);
            }
            $configData = $schema->value(['directus' => Context::from_file($configFilePath)]);
        }

        $config = new Config($configData);
        $configs[$configFilePath] = $config;

        return $config;
    }
}

if (!function_exists('get_app_base_path')) {
    /**
     * Returns the application base path.
     *
     * @return string
     */
    function get_app_base_path()
    {
        $container = Application::getInstance()->getContainer();

        return $container->get('path_base');
    }
}

if (!function_exists('scan_folder')) {
    /**
     * Scan folder and return the php files (Project Configurations).
     *
     * @return string
     */
    function scan_folder($folder)
    {
        $projectNames = [];
        $ignoreableFiles = ['.DS_Store', '..', '.'];
        $scannedDirectory = array_values(array_diff(scandir($folder), $ignoreableFiles));
        if (!empty($scannedDirectory)) {
            foreach ($scannedDirectory as $fileName) {
                $fileObject = explode('.', $fileName);

                if (end($fileObject) == 'php') {
                    if (strlen($fileObject[0]) == 1 || StringUtils::startsWith($fileName, '_') === false) {
                        $projectNames[] = implode('.', $fileObject);
                    }
                }
            }
        }

        return $projectNames;
    }
}

if (!function_exists('ping_route')) {
    /**
     * Returns a ping route.
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
     * Create a new ping the server route.
     *
     * @param Application $app
     *
     * @return Application
     */
    function create_ping_route(Application $app)
    {
        /*
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
     * Create a new install route.
     *
     * @param Application $app
     *
     * @return Application
     */
    function create_install_route(Application $app)
    {
        $app->post('/projects', ProjectsCreate::class);

        return $app;
    }
}

if (!function_exists('create_ping_server')) {
    /**
     * Creates a simple app.
     *
     * @param string $basePath
     * @param array  $config
     * @param array  $values
     *
     * @return Application
     */
    function create_ping_server($basePath, array $config = [], array $values = [])
    {
        $app = create_app($basePath, array_merge([
            'app' => [
                'env' => 'production',
            ],
        ], $config), $values);

        $app->group('/server', function () {
            create_ping_route($this);
        });

        return $app;
    }
}

if (!function_exists('create_default_app')) {
    /**
     * Creates a simple app.
     *
     * @param string $basePath
     * @param array  $config
     * @param array  $values
     *
     * @return Application
     */
    function create_default_app($basePath, array $config = [], array $values = [])
    {
        if (!isset($values['notFoundHandler'])) {
            $values['notFoundHandler'] = function () {
                return new NotInstalledNotFoundHandler();
            };
        }

        $app = create_app($basePath, array_merge([
            'app' => [
                'env' => 'production',
            ],
        ], $config), $values);

        $app->add(new CorsMiddleware($app->getContainer(), true));

        $app->get('/', \Directus\Api\Routes\Home::class);
        $app->group('/server', \Directus\Api\Routes\Server::class);

        create_install_route($app);

        return $app;
    }
}

if (!function_exists('create_unknown_project_app')) {
    /**
     * Creates a simple Application when the project name is unknown.
     *
     * @param string $basePath
     * @param array  $config
     * @param array  $values
     *
     * @return Application
     */
    function create_unknown_project_app($basePath, array $config = [], array $values = [])
    {
        return create_default_app($basePath, $config, array_merge($values, [
            'notFoundHandler' => function () {
                return function () {
                    throw new UnauthorizedException('Unauthorized request');
                };
            },
        ]));
    }
}

if (!function_exists('ping_server')) {
    /**
     * Ping the API Server.
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
