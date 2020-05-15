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
            $this->instances[$name] = $this->build($name, $this->getConfig($name));
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
        return $this->get($this->getDefaultKey());
    }

    /**
     * Returns a transport configuration based on its name
     *
     * @param string $name
     *
     * @return array
     */
    public function getConfig($name)
    {
        return ArrayUtils::get($this->config, $name, []);
    }

    /**
     * Returns the default transport configuration
     *
     * @return array
     */
    public function getDefaultConfig()
    {
        return $this->getConfig($this->getDefaultKey());
    }

    /**
     * Returns the default transport key
     *
     * @return null|string
     */
    protected function getDefaultKey()
    {
        $key = null;
        if (array_key_exists('default', $this->transports)) {
            $key = 'default';
        } else if (count($this->transports) > 0) {
            reset($this->transports);
            $key = key($this->transports);
        }

        return $key;
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
                sprintf('%s is not an instance of %s', gettype($instance), AbstractTransport::class)
            );
        }

        return $instance;
    }
}
