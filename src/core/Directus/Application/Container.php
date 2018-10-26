<?php

namespace Directus\Application;

use Directus\Collection\Collection;

class Container extends \Directus\Container\Container
{
    /**
     * Default settings
     *
     * @var array
     */
    protected $defaultSettings = [
        'httpVersion' => '1.1',
        'responseChunkSize' => 4096,
        'outputBuffering' => 'append',
        'determineRouteBeforeAppMiddleware' => false,
        'displayErrorDetails' => false,
        'addContentLengthHeader' => true,
        'routerCacheFile' => false,
    ];

    /**
     * @inheritdoc
     */
    public function __construct(array $values = [])
    {
        parent::__construct($values);

        $userSettings = isset($values['settings']) ? $values['settings'] : [];
        $this->registerDefaultProviders($userSettings);
        $this->registerCoreProviders();
    }

    protected function registerDefaultProviders(array $userSettings)
    {
        $defaultSettings = $this->defaultSettings;

        /**
         * This service MUST return an array or an
         * instance of \ArrayAccess.
         *
         * @return array|\ArrayAccess
         */
        $this['settings'] = function () use ($userSettings, $defaultSettings) {
            return new Collection(array_merge($defaultSettings, $userSettings));
        };

        $defaultProvider = new DefaultServicesProvider();
        $defaultProvider->register($this);
    }

    protected function registerCoreProviders()
    {
        $coreProviders = new CoreServicesProvider();
        $coreProviders->register($this);
    }
}
