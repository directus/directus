<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Driver\Sqlsrv;

use Zend\Db\Adapter\Driver\AbstractConnection;
use Zend\Db\Adapter\Driver\Sqlsrv\Exception\ErrorException;
use Zend\Db\Adapter\Exception;

class Connection extends AbstractConnection
{
    /**
     * @var Sqlsrv
     */
    protected $driver = null;

    /**
     * Constructor
     *
     * @param  array|resource                                      $connectionInfo
     * @throws \Zend\Db\Adapter\Exception\InvalidArgumentException
     */
    public function __construct($connectionInfo)
    {
        if (is_array($connectionInfo)) {
            $this->setConnectionParameters($connectionInfo);
        } elseif (is_resource($connectionInfo)) {
            $this->setResource($connectionInfo);
        } else {
            throw new Exception\InvalidArgumentException('$connection must be an array of parameters or a resource');
        }
    }

    /**
     * Set driver
     *
     * @param  Sqlsrv $driver
     * @return self Provides a fluent interface
     */
    public function setDriver(Sqlsrv $driver)
    {
        $this->driver = $driver;

        return $this;
    }

    /**
     * {@inheritDoc}
     */
    public function getCurrentSchema()
    {
        if (! $this->isConnected()) {
            $this->connect();
        }

        $result = sqlsrv_query($this->resource, 'SELECT SCHEMA_NAME()');
        $r = sqlsrv_fetch_array($result);

        return $r[0];
    }

    /**
     * Set resource
     *
     * @param  resource $resource
     * @return self Provides a fluent interface
     * @throws Exception\InvalidArgumentException
     */
    public function setResource($resource)
    {
        if (get_resource_type($resource) !== 'SQL Server Connection') {
            throw new Exception\InvalidArgumentException('Resource provided was not of type SQL Server Connection');
        }
        $this->resource = $resource;

        return $this;
    }

    /**
     * {@inheritDoc}
     *
     * @throws Exception\RuntimeException
     */
    public function connect()
    {
        if ($this->resource) {
            return $this;
        }

        $serverName = '.';
        $params = [
            'ReturnDatesAsStrings' => true
        ];
        foreach ($this->connectionParameters as $key => $value) {
            switch (strtolower($key)) {
                case 'hostname':
                case 'servername':
                    $serverName = (string) $value;
                    break;
                case 'username':
                case 'uid':
                    $params['UID'] = (string) $value;
                    break;
                case 'password':
                case 'pwd':
                    $params['PWD'] = (string) $value;
                    break;
                case 'database':
                case 'dbname':
                    $params['Database'] = (string) $value;
                    break;
                case 'charset':
                    $params['CharacterSet'] = (string) $value;
                    break;
                case 'driver_options':
                case 'options':
                    $params = array_merge($params, (array) $value);
                    break;
            }
        }

        $this->resource = sqlsrv_connect($serverName, $params);

        if (! $this->resource) {
            throw new Exception\RuntimeException(
                'Connect Error',
                null,
                new ErrorException(sqlsrv_errors())
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
        sqlsrv_close($this->resource);
        $this->resource = null;
    }

    /**
     * {@inheritDoc}
     */
    public function beginTransaction()
    {
        if (! $this->isConnected()) {
            $this->connect();
        }

        if (sqlsrv_begin_transaction($this->resource) === false) {
            throw new Exception\RuntimeException(
                new ErrorException(sqlsrv_errors())
            );
        }

        $this->inTransaction = true;

        return $this;
    }

    /**
     * {@inheritDoc}
     */
    public function commit()
    {
        // http://msdn.microsoft.com/en-us/library/cc296194.aspx

        if (! $this->isConnected()) {
            $this->connect();
        }

        sqlsrv_commit($this->resource);

        $this->inTransaction = false;

        return $this;
    }

    /**
     * {@inheritDoc}
     */
    public function rollback()
    {
        // http://msdn.microsoft.com/en-us/library/cc296176.aspx

        if (! $this->isConnected()) {
            throw new Exception\RuntimeException('Must be connected before you can rollback.');
        }

        sqlsrv_rollback($this->resource);
        $this->inTransaction = false;

        return $this;
    }

    /**
     * {@inheritDoc}
     *
     * @throws Exception\RuntimeException
     */
    public function execute($sql)
    {
        if (! $this->isConnected()) {
            $this->connect();
        }

        if (! $this->driver instanceof Sqlsrv) {
            throw new Exception\RuntimeException('Connection is missing an instance of Sqlsrv');
        }

        if ($this->profiler) {
            $this->profiler->profilerStart($sql);
        }

        $returnValue = sqlsrv_query($this->resource, $sql);

        if ($this->profiler) {
            $this->profiler->profilerFinish($sql);
        }

        // if the returnValue is something other than a Sqlsrv_result, bypass wrapping it
        if ($returnValue === false) {
            $errors = sqlsrv_errors();
            // ignore general warnings
            if ($errors[0]['SQLSTATE'] != '01000') {
                throw new Exception\RuntimeException(
                    'An exception occurred while trying to execute the provided $sql',
                    null,
                    new ErrorException($errors)
                );
            }
        }

        $result = $this->driver->createResult($returnValue);

        return $result;
    }

    /**
     * Prepare
     *
     * @param  string $sql
     * @return string
     */
    public function prepare($sql)
    {
        if (! $this->isConnected()) {
            $this->connect();
        }

        $statement = $this->driver->createStatement($sql);

        return $statement;
    }

    /**
     * {@inheritDoc}
     *
     * @return mixed
     */
    public function getLastGeneratedValue($name = null)
    {
        if (! $this->resource) {
            $this->connect();
        }
        $sql = 'SELECT @@IDENTITY as Current_Identity';
        $result = sqlsrv_query($this->resource, $sql);
        $row = sqlsrv_fetch_array($result);

        return $row['Current_Identity'];
    }
}
