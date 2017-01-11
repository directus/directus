<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Driver\IbmDb2;

use Zend\Db\Adapter\Driver\AbstractConnection;
use Zend\Db\Adapter\Exception;

class Connection extends AbstractConnection
{
    /**
     * @var IbmDb2
     */
    protected $driver = null;

    /**
     * i5 OS
     *
     * @var bool
     */
    protected $i5;

    /**
     * Previous autocommit set
     *
     * @var mixed
     */
    protected $prevAutocommit;

    /**
     * Constructor
     *
     * @param  array|resource|null                $connectionParameters (ibm_db2 connection resource)
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
     * @param  IbmDb2 $driver
     * @return self
     */
    public function setDriver(IbmDb2 $driver)
    {
        $this->driver = $driver;

        return $this;
    }

    /**
     * @param  resource $resource DB2 resource
     * @return self
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
     * {@inheritDoc}
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

        $database     = $findParameterValue(['database', 'db']);
        $username     = $findParameterValue(['username', 'uid', 'UID']);
        $password     = $findParameterValue(['password', 'pwd', 'PWD']);
        $isPersistent = $findParameterValue(['persistent', 'PERSISTENT', 'Persistent']);
        $options      = (isset($p['driver_options']) ? $p['driver_options'] : []);
        $connect      = ((bool) $isPersistent) ? 'db2_pconnect' : 'db2_connect';

        $this->resource = $connect($database, $username, $password, $options);

        if ($this->resource === false) {
            throw new Exception\RuntimeException(sprintf(
                '%s: Unable to connect to database',
                __METHOD__
            ));
        }

        return $this;
    }

    /**
     * {@inheritDoc}
     */
    public function isConnected()
    {
        return ($this->resource !== null);
    }

    /**
     * {@inheritDoc}
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
     * {@inheritDoc}
     */
    public function beginTransaction()
    {
        if ($this->isI5() && !ini_get('ibm_db2.i5_allow_commit')) {
            throw new Exception\RuntimeException(
                'DB2 transactions are not enabled, you need to set the ibm_db2.i5_allow_commit=1 in your php.ini'
            );
        }

        if (!$this->isConnected()) {
            $this->connect();
        }

        $this->prevAutocommit = db2_autocommit($this->resource);
        db2_autocommit($this->resource, DB2_AUTOCOMMIT_OFF);
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

        if (!db2_commit($this->resource)) {
            throw new Exception\RuntimeException("The commit has not been successful");
        }

        if ($this->prevAutocommit) {
            db2_autocommit($this->resource, $this->prevAutocommit);
        }

        $this->inTransaction = false;

        return $this;
    }

    /**
     * Rollback
     *
     * @return Connection
     */
    public function rollback()
    {
        if (!$this->isConnected()) {
            throw new Exception\RuntimeException('Must be connected before you can rollback.');
        }

        if (!$this->inTransaction()) {
            throw new Exception\RuntimeException('Must call beginTransaction() before you can rollback.');
        }

        if (!db2_rollback($this->resource)) {
            throw new Exception\RuntimeException('The rollback has not been successful');
        }

        if ($this->prevAutocommit) {
            db2_autocommit($this->resource, $this->prevAutocommit);
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

        return $this->driver->createResult(($resultResource === true) ? $this->resource : $resultResource);
    }

    /**
     * {@inheritDoc}
     */
    public function getLastGeneratedValue($name = null)
    {
        return db2_last_insert_id($this->resource);
    }

    /**
     * Determine if the OS is OS400 (AS400, IBM i)
     *
     * @return bool
     */
    protected function isI5()
    {
        if (isset($this->i5)) {
            return $this->i5;
        }

        $this->i5 = (php_uname('s') == 'OS400');

        return $this->i5;
    }
}
