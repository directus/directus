<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Driver\Oci8;

use Zend\Db\Adapter\Driver\ConnectionInterface;
use Zend\Db\Adapter\Exception;
use Zend\Db\Adapter\Profiler;

class Connection implements ConnectionInterface, Profiler\ProfilerAwareInterface
{
    /**
     * @var Oci8
     */
    protected $driver = null;

    /**
     * @var Profiler\ProfilerInterface
     */
    protected $profiler = null;

    /**
     * Connection parameters
     *
     * @var array
     */
    protected $connectionParameters = array();

    /**
     * @var
     */
    protected $resource = null;

    /**
     * In transaction
     *
     * @var bool
     */
    protected $inTransaction = false;

    /**
     * Constructor
     *
     * @param array|resource|null $connectionInfo
     * @throws \Zend\Db\Adapter\Exception\InvalidArgumentException
     */
    public function __construct($connectionInfo = null)
    {
        if (is_array($connectionInfo)) {
            $this->setConnectionParameters($connectionInfo);
        } elseif ($connectionInfo instanceof \oci8) {
            $this->setResource($connectionInfo);
        } elseif (null !== $connectionInfo) {
            throw new Exception\InvalidArgumentException('$connection must be an array of parameters, a oci8 resource or null');
        }
    }

    /**
     * @param Oci8 $driver
     * @return Connection
     */
    public function setDriver(Oci8 $driver)
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
     * Set connection parameters
     *
     * @param  array $connectionParameters
     * @return Connection
     */
    public function setConnectionParameters(array $connectionParameters)
    {
        $this->connectionParameters = $connectionParameters;
        return $this;
    }

    /**
     * Get connection parameters
     *
     * @return array
     */
    public function getConnectionParameters()
    {
        return $this->connectionParameters;
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

        $query = "SELECT sys_context('USERENV', 'CURRENT_SCHEMA') as \"current_schema\" FROM DUAL";
        $stmt = oci_parse($this->resource, $query);
        oci_execute($stmt);
        $dbNameArray = oci_fetch_array($stmt, OCI_ASSOC);
        return $dbNameArray['current_schema'];
    }

    /**
     * Set resource
     *
     * @param  resource $resource
     * @return Connection
     */
    public function setResource($resource)
    {
        if (!is_resource($resource) || get_resource_type($resource) !== 'oci8 connection') {
            throw new Exception\InvalidArgumentException('A resource of type "oci8 connection" was expected');
        }
        $this->resource = $resource;
        return $this;
    }

    /**
     * Get resource
     *
     * @return \oci8
     */
    public function getResource()
    {
        $this->connect();
        return $this->resource;
    }

    /**
     * Connect
     *
     * @return Connection
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

        // http://www.php.net/manual/en/function.oci-connect.php
        $username = $findParameterValue(array('username'));
        $password = $findParameterValue(array('password'));
        $connectionString = $findParameterValue(array('connection_string', 'connectionstring', 'connection', 'hostname', 'instance'));
        $characterSet = $findParameterValue(array('character_set', 'charset', 'encoding'));
        $sessionMode = $findParameterValue(array('session_mode'));

        // connection modifiers
        $isUnique = $findParameterValue(array('unique'));
        $isPersistent = $findParameterValue(array('persistent'));

        if ($isUnique == true) {
            $this->resource = oci_new_connect($username, $password, $connectionString, $characterSet, $sessionMode);
        } elseif ($isPersistent == true) {
            $this->resource = oci_pconnect($username, $password, $connectionString, $characterSet, $sessionMode);
        } else {
            $this->resource = oci_connect($username, $password, $connectionString, $characterSet, $sessionMode);
        }

        if (!$this->resource) {
            $e = oci_error();
            throw new Exception\RuntimeException(
                'Connection error',
                null,
                new Exception\ErrorException($e['message'], $e['code'])
            );
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
        return (is_resource($this->resource));
    }

    /**
     * Disconnect
     */
    public function disconnect()
    {
        if (is_resource($this->resource)) {
            oci_close($this->resource);
        }
    }

    /**
     * Begin transaction
     */
    public function beginTransaction()
    {
        if (!$this->isConnected()) {
            $this->connect();
        }

        // A transaction begins when the first SQL statement that changes data is executed with oci_execute() using the OCI_NO_AUTO_COMMIT flag.
        $this->inTransaction = true;
    }

    /**
     * In transaction
     *
     * @return bool
     */
    public function inTransaction()
    {
        return $this->inTransaction;
    }

    /**
     * Commit
     */
    public function commit()
    {
        if (!$this->resource) {
            $this->connect();
        }

        if ($this->inTransaction) {
            $valid = oci_commit($this->resource);
            if ($valid === false) {
                $e = oci_error($this->resource);
                throw new Exception\InvalidQueryException($e['message'], $e['code']);
            }
        }
    }

    /**
     * Rollback
     *
     * @return Connection
     */
    public function rollback()
    {
        if (!$this->resource) {
            throw new Exception\RuntimeException('Must be connected before you can rollback.');
        }

        if (!$this->inTransaction) {
            throw new Exception\RuntimeException('Must call commit() before you can rollback.');
        }

        $valid = oci_rollback($this->resource);
        if ($valid === false) {
            $e = oci_error($this->resource);
            throw new Exception\InvalidQueryException($e['message'], $e['code']);
        }

        return $this;
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

        $ociStmt = oci_parse($this->resource, $sql);

        if ($this->inTransaction) {
            $valid = @oci_execute($ociStmt, OCI_NO_AUTO_COMMIT);
        } else {
            $valid = @oci_execute($ociStmt, OCI_COMMIT_ON_SUCCESS);
        }

        if ($this->profiler) {
            $this->profiler->profilerFinish($sql);
        }

        if ($valid === false) {
            $e = oci_error($ociStmt);
            throw new Exception\InvalidQueryException($e['message'], $e['code']);
        }

        $resultPrototype = $this->driver->createResult($ociStmt);
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
        // @todo Get Last Generated Value in Connection (this might not apply)
        return null;
    }
}
