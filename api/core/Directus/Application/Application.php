<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2016 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Application;

use Directus\Bootstrap;
use Directus\Util\ArrayUtils;
use Slim\Http\Util;
use Slim\Slim;

/**
 * Application
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class Application extends Slim
{
    /**
     * @var bool
     */
    protected $booted = false;

    /**
     * @var array
     */
    protected $providers = [];

    /**
     * Application constructor.
     *
     * @param array $userSettings
     */

    public function __construct(array $userSettings)
    {
        parent::__construct($userSettings);

        $this->container->singleton('response', function () {
            return new BaseResponse();
        });

        $request = $this->request();
        // @NOTE: Slim request do not parse a json request body
        //        We need to parse it ourselves
        if ($request->getMediaType() == 'application/json') {
            $env = $this->environment();
            $jsonRequest = json_decode($request->getBody(), true);
            $env['slim.request.form_hash'] = Util::stripSlashesIfMagicQuotes($jsonRequest);
        }

        $this->hook('slim.before.router', [$this, 'guessOutputFormat']);
    }

    /**
     * Register a provider
     *
     * @param ServiceProviderInterface $provider
     *
     * @return $this
     */
    public function register(ServiceProviderInterface $provider)
    {
        $provider->register($this);

        $this->providers[] = $provider;

        return $this;
    }

    public function run()
    {
        if (!$this->booted) {
            $this->boot();
        }

        parent::run();
    }

    public function boot()
    {
        if ($this->booted) {
            return;
        }

        foreach($this->providers as $provider) {
            $provider->boot($this);
        }

        $this->booted = true;
    }

    public function response()
    {
        $response = parent::response();

        if (func_num_args() > 0) {
            $data = ArrayUtils::get(func_get_args(), 0);
            $options = ArrayUtils::get(func_get_args(), 1);

            $data = $this->triggerResponseFilter($data, (array) $options);

            // @TODO: Response will support xml
            $response->setBody(json_encode($data));
        }

        return $response;
    }

    /**
     * Trigger Filter by name with its payload
     *
     * @param $name
     * @param $payload
     *
     * @return mixed
     */
    protected function triggerFilter($name, $payload)
    {
        $emitter = Bootstrap::get('hookEmitter');
        $payload = $emitter->apply($name, $payload);

        return $payload;
    }

    /**
     * Trigger a response filter
     *
     * @param $data
     * @param array $options
     *
     * @return mixed
     */
    protected function triggerResponseFilter($data, array $options)
    {
        $uriParts = explode('/', trim($this->request()->getResourceUri(), '/'));
        $apiVersion = (float) array_shift($uriParts);

        if ($apiVersion > 1) {
            $meta = ArrayUtils::get($data, 'meta');
        } else {
            $meta = [
                'type' => array_key_exists('rows', $data) ? 'collection' : 'item',
                'table' => ArrayUtils::get($options, 'table')
            ];
        }

        $payload = (object) array_merge($options, [
            'apiVersion' => $apiVersion,
            'data' => $data,
            'meta' => $meta,
            'request' => [
                'path' => $this->request()->getResourceUri(),
                'method' => $this->request()->getMethod()
            ]
        ]);

        $method = strtolower($this->request()->getMethod());
        $payload = $this->triggerFilter('response', $payload);
        $payload = $this->triggerFilter('response.' . $method, $payload);
        if ($meta['table']) {
            $payload = $this->triggerFilter('response.' . $meta['table'], $payload);
            $payload = $this->triggerFilter(sprintf('response.%s.%s',
                $meta['table'],
                $method
            ), $payload);
        }

        return $payload->data;
    }

    /**
     * @inheritdoc
     */
    protected function mapRoute($args)
    {
        $pattern = array_shift($args);
        $callable = $this->resolveCallable(array_pop($args));
        $route = new \Slim\Route($pattern, $callable);
        $this->router->map($route);
        if (count($args) > 0) {
            $route->setMiddleware($args);
        }

        return $route;
    }

    /**
     * Resolve toResolve into a closure that that the router can dispatch.
     *
     * If toResolve is of the format 'class:method', then try to extract 'class'
     * from the container otherwise instantiate it and then dispatch 'method'.
     *
     * @param mixed $toResolve
     *
     * @return callable
     *
     * @throws \RuntimeException if the callable does not exist
     * @throws \RuntimeException if the callable is not resolvable
     */
    public function resolveCallable($toResolve)
    {
        $resolved = $toResolve;

        if (!is_callable($toResolve) && is_string($toResolve)) {
            // check for slim callable as "class:method"
            $callablePattern = '!^([^\:]+)\:([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)$!';
            if (preg_match($callablePattern, $toResolve, $matches)) {
                $class = $matches[1];
                $method = $matches[2];

                if ($this->container->has($class)) {
                    $resolved = [$this->container->get($class), $method];
                } else {
                    if (!class_exists($class)) {
                        throw new \RuntimeException(sprintf('Callable %s does not exist', $class));
                    }
                    $resolved = [new $class($this), $method];
                }
            } else {
                // check if string is something in the DIC that's callable or is a class name which
                // has an __invoke() method
                $class = $toResolve;
                if ($this->container->has($class)) {
                    $resolved = $this->container->get($class);
                } else {
                    if (!class_exists($class)) {
                        throw new \RuntimeException(sprintf('Callable %s does not exist', $class));
                    }
                    $resolved = new $class($this);
                }
            }
        }

        if (!is_callable($resolved)) {
            throw new \RuntimeException(sprintf(
                '%s is not resolvable',
                is_array($toResolve) || is_object($toResolve) ? json_encode($toResolve) : $toResolve
            ));
        }

        return $resolved;
    }

    protected function guessOutputFormat()
    {
        $app = $this;
        $outputFormat = 'json';
        $requestUri = $app->request->getResourceUri();

        if ($this->requestHasOutputFormat()) {
            $outputFormat = $this->getOutputFormat();
            // @TODO: create a replace last/first ocurrence
            $pos = strrpos($requestUri, '.' . $outputFormat);
            $newRequestUri = substr_replace($requestUri, '', $pos, strlen('.' . $outputFormat));
            $env = $app->environment();
            $env['PATH_INFO'] = $newRequestUri;
        }

        return $outputFormat;
    }

    protected function requestHasOutputFormat()
    {
        $matches = $this->getOutputFormat();

        return $matches ? true : false;
    }

    protected function getOutputFormat()
    {
        $requestUri = trim($this->request->getResourceUri(), '/');

        // @TODO: create a startsWith and endsWith using regex
        $matches = [];
        preg_match('#\.[\w]+$#', $requestUri, $matches);

        return isset($matches[0]) ? substr($matches[0], 1) : null;
    }
}
