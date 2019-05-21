<?php

namespace Directus;

use Directus\Application\Application;
use Directus\Exception\Exception;
use Directus\Util\ArrayUtils;

if (!function_exists('get_custom_x')) {
    /**
     * @param string $type
     * @param string $path
     * @param bool $onlyDirectories Ignores files in the given path
     *
     * @return array
     *
     * @throws Exception
     */
    function get_custom_x($type, $path, $onlyDirectories = false)
    {
        $extensionsPath = base_path($path);
        if (!file_exists($extensionsPath)) {
            return [];
        }

        $files = find_php_files($extensionsPath, 1);
        $extensions = [];
        $ignoredDirectories = [];

        if ($onlyDirectories) {
            $ignoredDirectories[] = '/';
        }

        foreach ($files as $file) {
            $relativePath = substr($file, strlen($extensionsPath));
            $pathInfo = pathinfo($relativePath);
            $dirname = $pathInfo['dirname'];
            $extensionName = $pathInfo['filename'];
            /**
             * For windows system the path is '\' instead of '/'. So we need to check for both slashes.
             */
            $isDirectory = $dirname !== '/' && $dirname !== '\\';

            // TODO: Need to improve logic
            if (in_array($dirname, $ignoredDirectories)) {
                continue;
            }

            if ($isDirectory) {
                if ($pathInfo['filename'] === $type) {
                    $ignoredDirectories[] = $dirname;
                    $extensionName = ltrim($dirname, '/');
                } else {
                    continue;
                }
            }

            $extensionInfo = require $file;
            if (!is_array($extensionInfo)) {
                throw new Exception(
                    sprintf(
                        'information for "%s" must be an array. "%s" was given instead in %s',
                        $type,
                        gettype($extensionInfo),
                        $relativePath
                    )
                );
            }

            // When a directory and file has the same name inside the path
            // /example/endpoints.php and example.php
            if (isset($extensions[$extensionName])) {
                throw new Exception(
                    sprintf('There is an endpoint already named "%s"', $extensionName)
                );
            }

            $extensions[$extensionName] = $extensionInfo;
        }

        return $extensions;
    }
}

if (!function_exists('get_custom_endpoints')) {
    /**
     * Get the list of custom endpoints information
     *
     * @param string $path
     * @param bool $onlyDirectories
     *
     * @return array
     *
     * @throws \Directus\Exception\Exception
     */
    function get_custom_endpoints($path, $onlyDirectories = false)
    {
        return get_custom_x('endpoints', $path, $onlyDirectories);
    }
}

if (!function_exists('create_group_route_from_array')) {
    /**
     * Creates a grouped routes in the given app
     *
     * @param \Directus\Application\Application $app
     * @param string $groupName
     * @param array $endpoints
     */
    function create_group_route_from_array(\Directus\Application\Application $app, $groupName, array $endpoints)
    {
        $app->group('/' . trim($groupName, '/'), function () use ($endpoints, $app) {
            foreach ($endpoints as $routePath => $endpoint) {
                $isGroup = \Directus\Util\ArrayUtils::get($endpoint, 'group', false) === true;

                if ($isGroup) {
                    create_group_route_from_array(
                        $app,
                        $routePath,
                        (array) \Directus\Util\ArrayUtils::get($endpoint, 'endpoints', [])
                    );
                } else {
                    create_route_from_array($app, $routePath, $endpoint);
                }
            }
        });
    }
}

if (!function_exists('create_route_from_array')) {
    /**
     * Add a route to the given application
     *
     * @param Application $app
     * @param string $routePath
     * @param array $options
     *
     * @throws Exception
     */
    function create_route_from_array(Application $app, $routePath, array $options)
    {
        $methods = ArrayUtils::get($options, 'method', ['GET']);
        if (!is_array($methods)) {
            $methods = [$methods];
        }

        $handler = ArrayUtils::get($options, 'handler');
        if (!is_callable($handler) && !class_exists($handler)) {
            throw new Exception(
                sprintf('Endpoints handler must be a callable, but %s was given', gettype($handler))
            );
        }

        // Make sure the route path always start with a forward slash when it's not an empty string
        if ($routePath) {
            $routePath = '/' . ltrim($routePath, '/');
        }

        $app->map($methods, $routePath, $handler);
    }
}

if (!function_exists('get_custom_hooks')) {
    /**
     * Get a list of hooks in the given path
     *
     * @param string $path
     * @param bool $onlyDirectories
     *
     * @return array
     */
    function get_custom_hooks($path, $onlyDirectories = false)
    {
        return get_custom_x('hooks', $path, $onlyDirectories);
    }
}
