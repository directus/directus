<?php

namespace Directus\Session\Storage;

class ArraySessionStorage implements SessionStorageInterface
{
    /**
     * Session Name
     *
     * @var string
     */
    protected $sessionName;

    /**
     * Session was started
     *
     * @var bool
     */
    protected $started = false;

    /**
     * All items
     *
     * @var array
     */
    protected $items = [];

    /**
     * Options list
     *
     * @var array
     */
    protected $options = [];

    /**
     * Constructor
     *
     * @param array $options
     */
    public function __construct(array $options = [])
    {
        if (array_key_exists('name', $options) && !is_string($options['name'])) {
            throw new \InvalidArgumentException('Session name must be string value');
        }

        if (isset($options['name'])) {
            $this->sessionName = $options['name'];
        }

        $this->options = $options;
    }

    /**
     * {@inheritdoc}
     */
    public function getName()
    {
        return $this->sessionName;
    }

    /**
     * {@inheritdoc}
     */
    public function start()
    {
        if ($this->isStarted()) {
            return false;
        }

        $this->started = true;

        return $this->started;
    }

    /**
     * {@inheritdoc}
     */
    public function stop()
    {
        if ($this->isStarted()) {
            $this->started = false;
        }
    }

    /**
     * {@inheritdoc}
     */
    public function isStarted()
    {
        return (bool) $this->started;
    }

    /**
     * {@inheritdoc}
     */
    public function get($key)
    {
        $key = (string) $key;

        return array_key_exists($key, $this->items) ? $this->items[$key] : null;
    }

    public function getItems()
    {
        return $this->items;
    }

    /**
     * {@inheritdoc}
     */
    public function set($key, $value)
    {
        $this->items[(string)  $key] = $value;
    }

    /**
     * {@inheritdoc}
     */
    public function remove($key)
    {
        unset($this->items[(string) $key]);
    }

    public function clear()
    {
        $this->items = [];
    }
}
