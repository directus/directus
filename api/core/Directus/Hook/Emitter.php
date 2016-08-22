<?php

namespace Directus\Hook;

class Emitter
{
    /**
     * High priority.
     *
     * @const int
     */
    const P_HIGH = 100;

    /**
     * Normal priority.
     *
     * @const int
     */
    const P_NORMAL = 0;

    /**
     * Low priority.
     *
     * @const int
     */
    const P_LOW = -100;

    /**
     * List of registered action listeners
     *
     * @var array
     */
    protected $actionListeners = [];

    /**
     * List of registered filter listeners
     *
     * @var array
     */
    protected $filterListeners = [];

    public function addAction($name, $listener, $priority = self::P_NORMAL)
    {
        $this->validateListener($listener);

        $this->actionListeners[$name][$priority][] = $listener;
    }

    public function addFilter($name, $listener, $priority = self::P_NORMAL)
    {
        $this->validateListener($listener);

        $this->filterListeners[$name][$priority][] = $listener;
    }

    public function run($name, $data = [])
    {
        $listeners = $this->getActionListeners($name);

        if (!is_array($data)) {
            $data = [$data];
        }

        foreach ($listeners as $listener) {
            call_user_func_array($listener, $data);
        }
    }

    public function apply($name, $value)
    {
        $listeners = $this->getFilterListeners($name);

        foreach ($listeners as $listener) {
            $value = call_user_func_array($listener, [$value]);
        }

        return $value;
    }

    public function getActionListeners($name)
    {
        return $this->getListeners($this->actionListeners, $name);
    }

    public function getFilterListeners($name)
    {
        return $this->getListeners($this->filterListeners, $name);
    }

    protected function validateListener($listener)
    {
        if (!is_callable($listener) && !($listener instanceof HookInterface)) {
            throw new \InvalidArgumentException('Listener needs to be a callable or an instance of \Directus\Hook\HookInterface');
        }
    }

    protected function getListeners(array $items, $name)
    {
        $functions = [];
        if (array_key_exists($name, $items)) {
            $listeners = $items[$name];
            krsort($listeners);
            $functions = call_user_func_array('array_merge', $listeners);
        }

        return $functions;
    }
}
