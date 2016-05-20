<?php

namespace Directus\Db;

use Directus\Util\StringUtils;
use Zend\Db\Adapter\Adapter;

class Connection extends Adapter
{
    /**
     * Name of the connection driver
     * @var string
     */
    protected $driverName;

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
     * Check if this connection has strict mode enabled.
     * @return bool
     * @throws \BadMethodCallException
     */
    public function isStrictModeEnabled()
    {
        switch($this->driverName) {
            case 'mysql':
                $enabled = $this->isMySQLStrictModeEnabled();
                break;
            default:
                throw new \BadMethodCallException("Driver '{$this->driverName}' not supported");
        }

        return $enabled;
    }

    /**
     * Check if MySQL has Strict mode enabled
     * @return bool
     */
    protected function isMySQLStrictModeEnabled()
    {
        $strictModes = ['STRICT_ALL_TABLES', 'STRICT_TRANS_TABLES'];
        $statement = $this->prepare('SELECT @@sql_mode as modes');
        $result = $statement->execute();
        $modesEnabled = $result->current();

        $modes = explode(',', $modesEnabled['modes']);
        foreach($modes as  $name) {
            $modeName = strtoupper(trim($name));
            if (in_array($modeName, $strictModes)) {
                return true;
            }
        }

        return false;
    }

    protected function createDriver($parameters)
    {
        $driver = parent::createDriver($parameters);
        $driverName = strtolower($parameters['driver']);

        if (StringUtils::startsWith($driverName, 'pdo_')) {
            $driverName = substr($driverName, 4);
        }

        $this->driverName = $driverName;

        return $driver;
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
