<?php

namespace Directus\Mail\Transports;

use Directus\Collection\Collection;

abstract class AbstractTransport
{
    /**
     * @var Collection
     */
    protected $config;

    public function __construct(array $config = [])
    {
        $this->config = new Collection($config);
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
     * @return \Swift_Transport
     */
    abstract public function getSwiftTransport();
}
