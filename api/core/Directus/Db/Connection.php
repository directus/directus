<?php

namespace Directus\Db;

use Zend\Db\Adapter\Adapter;

class Connection extends Adapter
{
    /**
     * Database configuration
     * @var array
     */
    protected $config = [];

    /**
     * Connection constructor.
     * @param array $config
     */
    public function __construct(array $config)
    {
        $this->config = $config;

        parent::__construct($config);
    }

    /**
     * Map all calls to the driver connection object.
     * @param $name
     * @param $arguments
     * @return mixed
     */
    public function __call($name, $arguments)
    {
        return call_user_func_array([$this->getDriver()->getConnection(), $name], $arguments);
    }
}
