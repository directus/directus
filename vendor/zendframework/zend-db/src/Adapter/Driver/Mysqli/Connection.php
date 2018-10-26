<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Driver\Mysqli;

use Exception as GenericException;
use Zend\Db\Adapter\Driver\AbstractConnection;
use Zend\Db\Adapter\Exception;

class Connection extends AbstractConnection
{
    /**
     * @var Mysqli
     */
    protected $driver = null;

    /**
     * @var \mysqli
     */
    protected $resource = null;

    /**
     * Constructor
     *
     * @param array|mysqli|null $connectionInfo
     * @throws \Zend\Db\Adapter\Exception\InvalidArgumentException
     */
    public function __construct($connectionInfo = null)
    {
        if (is_array($connectionInfo)) {
            $this->setConnectionParameters($connectionInfo);
        } elseif ($connectionInfo instanceof \mysqli) {
            $this->setResource($connectionInfo);
        } elseif (null !== $connectionInfo) {
            throw new Exception\InvalidArgumentException(
                '$connection must be an array of parameters, a mysqli object or null'
            );
        }
    }

    /**
     * @param  Mysqli $driver
     * @return self Provides a fluent interface
     */
    public function setDriver(Mysqli $driver)
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

        $result = $this->resource->query('SELECT DATABASE()');
        $r = $result->fetch_row();

        return $r[0];
    }

    /**
     * Set resource
     *
     * @param  \mysqli $resource
     * @return self Provides a fluent interface
     */
    public function setResource(\mysqli $resource)
    {
        $this->resource = $resource;

        return $this;
    }

    /**
     * {@inheritDoc}
     */
    public function connect()
    {
        if ($this->resource instanceof \mysqli) {
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

        $hostname = $findParameterValue(['hostname', 'host']);
        $username = $findParameterValue(['username', 'user']);
        $password = $findParameterValue(['password', 'passwd', 'pw']);
        $database = $findParameterValue(['database', 'dbname', 'db', 'schema']);
        $port     = (isset($p['port'])) ? (int) $p['port'] : null;
        $socket   = (isset($p['socket'])) ? $p['socket'] : null;

        $useSSL = (isset($p['use_ssl'])) ? $p['use_ssl'] : 0;
        $clientKey = (isset($p['client_key'])) ? $p['client_key'] : null;
        $clientCert = (isset($p['client_cert'])) ? $p['client_cert'] : null;
        $caCert = (isset($p['ca_cert'])) ? $p['ca_cert'] : null;
        $caPath = (isset($p['ca_path'])) ? $p['ca_path'] : null;
        $cipher = (isset($p['cipher'])) ? $p['cipher'] : null;

        $this->resource = new \mysqli();
        $this->resource->init();

        if (! empty($p['driver_options'])) {
            foreach ($p['driver_options'] as $option => $value) {
                if (is_string($option)) {
                    $option = strtoupper($option);
                    if (! defined($option)) {
                        continue;
                    }
                    $option = constant($option);
                }
                $this->resource->options($option, $value);
            }
        }

        $flags = null;

        if ($useSSL && ! $socket) {
            $this->resource->ssl_set($clientKey, $clientCert, $caCert, $caPath, $cipher);
            //MYSQLI_CLIENT_SSL_DONT_VERIFY_SERVER_CERT is not valid option, needs to be set as flag
            if (isset($p['driver_options'])
                && isset($p['driver_options'][MYSQLI_CLIENT_SSL_DONT_VERIFY_SERVER_CERT])
            ) {
                $flags = MYSQLI_CLIENT_SSL_DONT_VERIFY_SERVER_CERT;
            }
        }


        try {
            $this->resource->real_connect($hostname, $username, $password, $database, $port, $socket, $flags);
        } catch (GenericException $e) {
            throw new Exception\RuntimeException(
                'Connection error',
                null,
                new Exception\ErrorException($this->resource->connect_error, $this->resource->connect_errno)
            );
        }

        if ($this->resource->connect_error) {
            throw new Exception\RuntimeException(
                'Connection error',
                null,
                new Exception\ErrorException($this->resource->connect_error, $this->resource->connect_errno)
            );
        }

        if (! empty($p['charset'])) {
            $this->resource->set_charset($p['charset']);
        }

        return $this;
    }

    /**
     * {@inheritDoc}
     */
    public function isConnected()
    {
        return ($this->resource instanceof \mysqli);
    }

    /**
     * {@inheritDoc}
     */
    public function disconnect()
    {
        if ($this->resource instanceof \mysqli) {
            $this->resource->close();
        }
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

        $this->resource->autocommit(false);
        $this->inTransaction = true;

        return $this;
    }

    /**
     * {@inheritDoc}
     */
    public function commit()
    {
        if (! $this->isConnected()) {
            $this->connect();
        }

        $this->resource->commit();
        $this->inTransaction = false;
        $this->resource->autocommit(true);

        return $this;
    }

    /**
     * {@inheritDoc}
     */
    public function rollback()
    {
        if (! $this->isConnected()) {
            throw new Exception\RuntimeException('Must be connected before you can rollback.');
        }

        if (! $this->inTransaction) {
            throw new Exception\RuntimeException('Must call beginTransaction() before you can rollback.');
        }

        $this->resource->rollback();
        $this->resource->autocommit(true);
        $this->inTransaction = false;

        return $this;
    }

    /**
     * {@inheritDoc}
     *
     * @throws Exception\InvalidQueryException
     */
    public function execute($sql)
    {
        if (! $this->isConnected()) {
            $this->connect();
        }

        if ($this->profiler) {
            $this->profiler->profilerStart($sql);
        }

        $resultResource = $this->resource->query($sql);

        if ($this->profiler) {
            $this->profiler->profilerFinish($sql);
        }

        // if the returnValue is something other than a mysqli_result, bypass wrapping it
        if ($resultResource === false) {
            throw new Exception\InvalidQueryException($this->resource->error);
        }

        $resultPrototype = $this->driver->createResult(($resultResource === true) ? $this->resource : $resultResource);

        return $resultPrototype;
    }

    /**
     * {@inheritDoc}
     */
    public function getLastGeneratedValue($name = null)
    {
        return $this->resource->insert_id;
    }
}
