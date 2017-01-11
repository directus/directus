<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Driver\Oci8;

use Zend\Db\Adapter\Driver\AbstractConnection;
use Zend\Db\Adapter\Exception;

class Connection extends AbstractConnection
{
    /**
     * @var Oci8
     */
    protected $driver = null;

    /**
     * Constructor
     *
     * @param  array|resource|null                                 $connectionInfo
     * @throws \Zend\Db\Adapter\Exception\InvalidArgumentException
     */
    public function __construct($connectionInfo = null)
    {
        if (is_array($connectionInfo)) {
            $this->setConnectionParameters($connectionInfo);
        } elseif ($connectionInfo instanceof \oci8) {
            $this->setResource($connectionInfo);
        } elseif (null !== $connectionInfo) {
            throw new Exception\InvalidArgumentException('$connection must be an array of parameters, an oci8 resource or null');
        }
    }

    /**
     * @param  Oci8 $driver
     * @return self
     */
    public function setDriver(Oci8 $driver)
    {
        $this->driver = $driver;

        return $this;
    }

    /**
     * {@inheritDoc}
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
     * @return self
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
     * {@inheritDoc}
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

            return;
        };

        // http://www.php.net/manual/en/function.oci-connect.php
        $username = $findParameterValue(['username']);
        $password = $findParameterValue(['password']);
        $connectionString = $findParameterValue(['connection_string', 'connectionstring', 'connection', 'hostname', 'instance']);
        $characterSet = $findParameterValue(['character_set', 'charset', 'encoding']);
        $sessionMode = $findParameterValue(['session_mode']);

        // connection modifiers
        $isUnique = $findParameterValue(['unique']);
        $isPersistent = $findParameterValue(['persistent']);

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
     * {@inheritDoc}
     */
    public function isConnected()
    {
        return (is_resource($this->resource));
    }

    /**
     * {@inheritDoc}
     */
    public function disconnect()
    {
        if (is_resource($this->resource)) {
            oci_close($this->resource);
        }
    }

    /**
     * {@inheritDoc}
     */
    public function beginTransaction()
    {
        if (!$this->isConnected()) {
            $this->connect();
        }

        // A transaction begins when the first SQL statement that changes data is executed with oci_execute() using the OCI_NO_AUTO_COMMIT flag.
        $this->inTransaction = true;

        return $this;
    }

    /**
     * {@inheritDoc}
     */
    public function commit()
    {
        if (!$this->isConnected()) {
            $this->connect();
        }

        if ($this->inTransaction()) {
            $valid = oci_commit($this->resource);
            if ($valid === false) {
                $e = oci_error($this->resource);
                throw new Exception\InvalidQueryException($e['message'], $e['code']);
            }

            $this->inTransaction = false;
        }

        return $this;
    }

    /**
     * {@inheritDoc}
     */
    public function rollback()
    {
        if (!$this->isConnected()) {
            throw new Exception\RuntimeException('Must be connected before you can rollback.');
        }

        if (!$this->inTransaction()) {
            throw new Exception\RuntimeException('Must call commit() before you can rollback.');
        }

        $valid = oci_rollback($this->resource);
        if ($valid === false) {
            $e = oci_error($this->resource);
            throw new Exception\InvalidQueryException($e['message'], $e['code']);
        }

        $this->inTransaction = false;

        return $this;
    }

    /**
     * {@inheritDoc}
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
     * {@inheritDoc}
     */
    public function getLastGeneratedValue($name = null)
    {
        // @todo Get Last Generated Value in Connection (this might not apply)
        return;
    }
}
