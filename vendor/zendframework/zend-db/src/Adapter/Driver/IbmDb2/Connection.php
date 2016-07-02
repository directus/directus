<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Driver\IbmDb2;

use Zend\Db\Adapter\Driver\ConnectionInterface;
use Zend\Db\Adapter\Exception;
use Zend\Db\Adapter\Profiler;

class Connection implements ConnectionInterface, Profiler\ProfilerAwareInterface
{
    /** @var IbmDb2 */
    protected $driver = null;

    /**
     * @var array
     */
    protected $connectionParameters = null;

    /**
     * @var resource
     */
    protected $resource = null;

    /**
     * @var Profiler\ProfilerInterface
     */
    protected $profiler = null;

    /**
     * Constructor
     *
     * @param array|resource|null $connectionParameters (ibm_db2 connection resource)
     * @throws Exception\InvalidArgumentException
     */
    public function __construct($connectionParameters = null)
    {
        if (is_array($connectionParameters)) {
            $this->setConnectionParameters($connectionParameters);
        } elseif (is_resource($connectionParameters)) {
            $this->setResource($connectionParameters);
        } elseif (null !== $connectionParameters) {
            throw new Exception\InvalidArgumentException(
                '$connection must be an array of parameters, a db2 connection resource or null'
            );
        }
    }

    /**
     * Set driver
     *
     * @param IbmDb2 $driver
     * @return Connection
     */
    public function setDriver(IbmDb2 $driver)
    {
        $this->driver = $driver;
        return $this;
    }

    /**
     * @param Profiler\ProfilerInterface $profiler
     * @return Connection
     */
    public function setProfiler(Profiler\ProfilerInterface $profiler)
    {
        $this->profiler = $profiler;
        return $this;
    }

    /**
     * @return null|Profiler\ProfilerInterface
     */
    public function getProfiler()
    {
        return $this->profiler;
    }

    /**
     * @param array $connectionParameters
     * @return Connection
     */
    public function setConnectionParameters(array $connectionParameters)
    {
        $this->connectionParameters = $connectionParameters;
        return $this;
    }

    /**
     * @return array
     */
    public function getConnectionParameters()
    {
        return $this->connectionParameters;
    }

    /**
     * @param  resource $resource DB2 resource
     * @return Connection
     */
    public function setResource($resource)
    {
        if (!is_resource($resource) || get_resource_type($resource) !== 'DB2 Connection') {
            throw new Exception\InvalidArgumentException('The resource provided must be of type "DB2 Connection"');
        }
        $this->resource = $resource;
        return $this;
    }

    /**
     * Get current schema
     *
     * @return string
     */
    public function getCurrentSchema()
    {
        if (!$this->isConnected()) {
            $this->connect();
        }

        $info = db2_server_info($this->resource);
        return (isset($info->DB_NAME) ? $info->DB_NAME : '');
    }

    /**
     * Get resource
     *
     * @return mixed
     */
    public function getResource()
    {
        return $this->resource;
    }

    /**
     * Connect
     *
     * @return ConnectionInterface
     */
    public function connect()
    {
        if (is_resource($this->resource)) {
            return $this;
        }

        // localize
        $p = $this->connectionParameters;

        // given a list of key names, test for existence in $p
        $findParameterValue = function (array $names) use ($p) {
            foreach ($names as $name) {
                if (isset($p[$name])) {
                    return $p[$name];
                }
            }
            return null;
        };

        $database     = $findParameterValue(array('database', 'db'));
        $username     = $findParameterValue(array('username', 'uid', 'UID'));
        $password     = $findParameterValue(array('password', 'pwd', 'PWD'));
        $isPersistent = $findParameterValue(array('persistent', 'PERSISTENT', 'Persistent'));
        $options      = (isset($p['driver_options']) ? $p['driver_options'] : array());

        if ($isPersistent) {
            $this->resource = db2_pconnect($database, $username, $password, $options);
        } else {
            $this->resource = db2_connect($database, $username, $password, $options);
        }

        if ($this->resource === false) {
            throw new Exception\RuntimeException(sprintf(
                '%s: Unable to connect to database',
                __METHOD__
            ));
        }
        return $this;
    }

    /**
     * Is connected
     *
     * @return bool
     */
    public function isConnected()
    {
        return ($this->resource !== null);
    }

    /**
     * Disconnect
     *
     * @return ConnectionInterface
     */
    public function disconnect()
    {
        if ($this->resource) {
            db2_close($this->resource);
            $this->resource = null;
        }
        return $this;
    }

    /**
     * Begin transaction
     *
     * @return ConnectionInterface
     */
    public function beginTransaction()
    {
        // TODO: Implement beginTransaction() method.
    }

    /**
     * Commit
     *
     * @return ConnectionInterface
     */
    public function commit()
    {
        // TODO: Implement commit() method.
    }

    /**
     * Rollback
     *
     * @return ConnectionInterface
     */
    public function rollback()
    {
        // TODO: Implement rollback() method.
    }

    /**
     * Execute
     *
     * @param  string $sql
     * @return Result
     */
    public function execute($sql)
    {
        if (!$this->isConnected()) {
            $this->connect();
        }

        if ($this->profiler) {
            $this->profiler->profilerStart($sql);
        }

        set_error_handler(function () {}, E_WARNING); // suppress warnings
        $resultResource = db2_exec($this->resource, $sql);
        restore_error_handler();

        if ($this->profiler) {
            $this->profiler->profilerFinish($sql);
        }

        // if the returnValue is something other than a pg result resource, bypass wrapping it
        if ($resultResource === false) {
            throw new Exception\InvalidQueryException(db2_stmt_errormsg());
        }

        $resultPrototype = $this->driver->createResult(($resultResource === true) ? $this->resource : $resultResource);
        return $resultPrototype;
    }

    /**
     * Get last generated id
     *
     * @param  null $name Ignored
     * @return int
     */
    public function getLastGeneratedValue($name = null)
    {
        return db2_last_insert_id($this->resource);
    }
}
