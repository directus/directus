<?php

namespace Directus\Mail;

use Directus\Exception\RuntimeException;
use Directus\Mail\Exception\InvalidTransportException;
use Directus\Mail\Exception\TransportNotFoundException;
use Directus\Mail\Transports\AbstractTransport;
use Directus\Util\ArrayUtils;

class TransportManager
{
    /**
     * @var array
     */
    protected $transports = [];

    /**
     * @var AbstractTransport[]
     */
    protected $instances = [];

    /**
     * @var array
     */
    protected $config = [];

    /**
     * Register a mailer with a name
     *
     * @param string $name
     * @param string $transport
     * @param array $config
     */
    public function register($name, $transport, array $config = [])
    {
        $this->transports[$name] = $transport;
        $this->config[$name] = $config;
    }

    /**
     * @param $name
     *
     * @return AbstractTransport
     */
    public function get($name)
    {
        if (!isset($this->instances[$name])) {
            $this->instances[$name] = $this->build($name, ArrayUtils::get($this->config, $name, []));
        }

        return $this->instances[$name];
    }

    /**
     * Gets the first or "default" adapter
     *
     * @return AbstractTransport|null
     */
    public function getDefault()
    {
        $instance = null;
        if (array_key_exists('default', $this->transports)) {
            $instance = $this->get('default');
        } else if (count($this->transports) > 0) {
            $instance = $this->get($this->transports[0]);
        }

        return $instance;
    }

    /**
     * Creates a instance of a transport registered with the given name
     *
     * @param string $name
     * @param array $config
     *
     * @return AbstractTransport
     *
     * @throws InvalidTransportException
     * @throws TransportNotFoundException
     */
    protected function build($name, array $config = [])
    {
        if (!array_key_exists($name, $this->transports)) {
            throw new TransportNotFoundException($name);
        }

        $transport = $this->transports[$name];
        if (!is_string($transport) && !is_object($transport) && !is_callable($transport)) {
            throw new InvalidTransportException($this->transports[$name]);
        }

        if (is_string($transport) && !class_exists($transport)) {
            throw new InvalidTransportException($this->transports[$name]);
        }

        if (is_callable($transport)) {
            $instance = call_user_func($transport);
        } else if (is_string($transport)) {
            $instance = new $transport($config);
        } else {
            $instance = $transport;
        }

        if (!($instance instanceof AbstractTransport)) {
            throw new RuntimeException(
                sprintf('%s is not an instance of %s', $instance, AbstractTransport::class)
            );
        }

        return $instance;
    }
}
