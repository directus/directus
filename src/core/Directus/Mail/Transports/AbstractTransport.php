<?php

namespace Directus\Mail\Transports;

use Directus\Collection\Collection;
use Swift_Events_EventListener;

abstract class AbstractTransport implements \Swift_Transport
{
    /**
     * @var Collection
     */
    protected $config;

    protected $listeners = [];

    protected $name;

    public function __construct(array $config = [])
    {
        $this->config = new Collection($config);
    }

    /**
     * @param string $name
     *
     * @deprecated
     */
    public function setName($name)
    {
        $this->name = $name;
    }

    /**
     * @return string
     *
     * @deprecated
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * Returns the configuration object
     *
     * @return Collection
     */
    public function getConfig()
    {
        return $this->config;
    }

    /**
     * Replaces the configuration with a new configuration dataset
     *
     * @param array $config
     */
    public function replaceConfig(array $config)
    {
        $this->config->replace($config);
    }

    /**
     * @inheritDoc
     */
    public function isStarted()
    {
        return true;
    }

    /**
     * @inheritDoc
     */
    public function start()
    {
        return true;
    }

    /**
     * @inheritDoc
     */
    public function stop()
    {
        return true;
    }

    /**
     * @inheritDoc
     */
    public function registerPlugin(Swift_Events_EventListener $plugin)
    {
        foreach ($this->listeners as $listener) {
            if ($listener === $plugin) {
                return;
            }
        }

        $this->listeners[] = $plugin;
    }
}
