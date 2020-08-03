<?php

namespace Directus\Application;

use Directus\Config\Config;
use Directus\Util\ArrayUtils;
use Slim\App;

class Application extends App
{
    /**
     * Directus version
     *
     * @var string
     */
    const DIRECTUS_VERSION = '8.8.1';

    /**
     * NOT USED
     *
     * @var bool
     */
    protected $booted = false;

    /**
     * NOT USED
     *
     * @var array
     */
    protected $providers = [

    ];

    /**
     * @var string
     */
    protected $basePath;

    /**
     * @var \Closure
     */
    protected $checkRequirementsFunction;

    protected static $instance = null;

    /**
     * Application constructor.
     *
     * @param string $basePath
     * @param array $config
     * @param array $values
     */
    public function __construct($basePath, array $config = [], array $values = [])
    {
        $container = $this->createConfig($config);

        // Set container dependencies before adding the defaults
        foreach ($values as $key => $value) {
            $container[$key] = $value;
        }

        $container = new Container($container);

        static::$instance = $this;

        parent::__construct($container);

        $this->setBasePath($basePath);
    }

    /**
     * Gets the application instance (singleton)
     *
     * This is a temporary solution until we get rid of the Bootstrap object
     *
     * @return $this
     */
    public static function getInstance()
    {
        return static::$instance;
    }

    /**
     * Gets an item from the application container
     *
     * @param string $key
     *
     * @return mixed
     */
    public function fromContainer($key)
    {
        return $this->getContainer()->get($key);
    }

    /**
     * Sets the application base path
     *
     * @param $path
     */
    public function setBasePath($path)
    {
        $this->basePath = rtrim($path, '/');

        $this->updatePaths();
    }

    protected function updatePaths()
    {
        $container = $this->getContainer();
        $container['path_base'] = $this->basePath;
    }

    /**
     * Application configuration object
     *
     * @return Config
     */
    public function getConfig()
    {
        return $this->getContainer()->get('config');
    }

    /**
     * Sets the function that checks the requirements
     *
     * @param \Closure $function
     */
    public function setCheckRequirementsFunction(\Closure $function)
    {
        $this->checkRequirementsFunction = $function;
    }

    /**
     * Creates the user configuration based on its configuration
     *
     * Mainly just separating the Slim settings with the Directus settings and adding paths
     *
     * @param array $appConfig
     *
     * @return array
     */
    protected function createConfig(array $appConfig)
    {
        return [
            'settings' => isset($appConfig['settings']) ? $appConfig['settings'] : [],
            'config' => function () use ($appConfig) {
                return new Config($appConfig);
            }
        ];
    }

    /**
     * @inheritdoc
     */
    public function run($silent = false)
    {
        if (!$this->booted) {
            $this->boot();
        }

        return parent::run($silent);
    }

    public function boot()
    {
        if (!$this->booted) {
            // foreach ($this->providers as $provider) {
            //     $provider->boot($this);
            // }

            $this->booted = true;
        }
    }

    /**
     * Get the Directus Version
     *
     * @return string
     */
    public function getVersion()
    {
        return static::DIRECTUS_VERSION;
    }

    /**
     * Trigger Filter by name with its payload
     *
     * @param $name
     * @param $payload
     *
     * @return mixed
     */
    public function triggerFilter($name, $payload)
    {
        return $this->getContainer()->get('hook_emitter')->apply($name, $payload);
    }

    /**
     * Trigger given action name
     *
     * @param $name
     * @param $params
     *
     * @return void
     */
    public function triggerAction($name, $params = [])
    {
        if (!is_array($params)) {
            $params = [$params];
        }

        array_unshift($params, $name);

        call_user_func_array([$this->getContainer()->get('hook_emitter'), 'run'], $params);
    }

    /**
     * Calls the given callable if there are missing requirements
     *
     * @param callable $callback
     */
    public function onMissingRequirements(Callable $callback)
    {
        $errors = $this->checkRequirementsFunction
            ? call_user_func($this->checkRequirementsFunction)
            : \Directus\get_missing_requirements();

        if ($errors) {
            $callback($errors);
        }
    }
}
