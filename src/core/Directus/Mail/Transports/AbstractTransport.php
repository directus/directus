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

    /**
     * @param string $name
     */
    public function setName($name)
    {
        $this->name = $name;
    }

    /**
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @return Collection
     */
    public function getConfig()
    {
        return $this->config;
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
