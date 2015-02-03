<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter;

use Zend\Db\ResultSet;

/**
 * @property Driver\DriverInterface $driver
 * @property Platform\PlatformInterface $platform
 */
class Adapter implements AdapterInterface, Profiler\ProfilerAwareInterface
{
    /**
     * Query Mode Constants
     */
    const QUERY_MODE_EXECUTE = 'execute';
    const QUERY_MODE_PREPARE = 'prepare';

    /**
     * Prepare Type Constants
     */
    const PREPARE_TYPE_POSITIONAL = 'positional';
    const PREPARE_TYPE_NAMED = 'named';

    const FUNCTION_FORMAT_PARAMETER_NAME = 'formatParameterName';
    const FUNCTION_QUOTE_IDENTIFIER = 'quoteIdentifier';
    const FUNCTION_QUOTE_VALUE = 'quoteValue';

    const VALUE_QUOTE_SEPARATOR = 'quoteSeparator';

    /**
     * @var Driver\DriverInterface
     */
    protected $driver = null;

    /**
     * @var Platform\PlatformInterface
     */
    protected $platform = null;

    /**
     * @var Profiler\ProfilerInterface
     */
    protected $profiler = null;

    /**
     * @var ResultSet\ResultSetInterface
     */
    protected $queryResultSetPrototype = null;

    /**
     * @var Driver\StatementInterface
     */
    protected $lastPreparedStatement = null;

    /**
     * @param Driver\DriverInterface|array $driver
     * @param Platform\PlatformInterface $platform
     * @param ResultSet\ResultSetInterface $queryResultPrototype
     * @param Profiler\ProfilerInterface $profiler
     * @throws Exception\InvalidArgumentException
     */
    public function __construct($driver, Platform\PlatformInterface $platform = null, ResultSet\ResultSetInterface $queryResultPrototype = null, Profiler\ProfilerInterface $profiler = null)
    {
        // first argument can be an array of parameters
        $parameters = array();

        if (is_array($driver)) {
            $parameters = $driver;
            if ($profiler === null && isset($parameters['profiler'])) {
                $profiler = $this->createProfiler($parameters);
            }
            $driver = $this->createDriver($parameters);
        } elseif (!$driver instanceof Driver\DriverInterface) {
            throw new Exception\InvalidArgumentException(
                'The supplied or instantiated driver object does not implement Zend\Db\Adapter\Driver\DriverInterface'
            );
        }

        $driver->checkEnvironment();
        $this->driver = $driver;

        if ($platform == null) {
            $platform = $this->createPlatform($parameters);
        }

        $this->platform = $platform;
        $this->queryResultSetPrototype = ($queryResultPrototype) ?: new ResultSet\ResultSet();

        if ($profiler) {
            $this->setProfiler($profiler);
        }
    }

    /**
     * @param Profiler\ProfilerInterface $profiler
     * @return Adapter
     */
    public function setProfiler(Profiler\ProfilerInterface $profiler)
    {
        $this->profiler = $profiler;
        if ($this->driver instanceof Profiler\ProfilerAwareInterface) {
            $this->driver->setProfiler($profiler);
        }
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
     * getDriver()
     *
     * @throws Exception\RuntimeException
     * @return Driver\DriverInterface
     */
    public function getDriver()
    {
        if ($this->driver == null) {
            throw new Exception\RuntimeException('Driver has not been set or configured for this adapter.');
        }
        return $this->driver;
    }

    /**
     * @return Platform\PlatformInterface
     */
    public function getPlatform()
    {
        return $this->platform;
    }

    /**
     * @return ResultSet\ResultSetInterface
     */
    public function getQueryResultSetPrototype()
    {
        return $this->queryResultSetPrototype;
    }

    public function getCurrentSchema()
    {
        return $this->driver->getConnection()->getCurrentSchema();
    }

    /**
     * query() is a convenience function
     *
     * @param string $sql
     * @param string|array|ParameterContainer $parametersOrQueryMode
     * @throws Exception\InvalidArgumentException
     * @return Driver\StatementInterface|ResultSet\ResultSet
     */
    public function query($sql, $parametersOrQueryMode = self::QUERY_MODE_PREPARE)
    {
        if (is_string($parametersOrQueryMode) && in_array($parametersOrQueryMode, array(self::QUERY_MODE_PREPARE, self::QUERY_MODE_EXECUTE))) {
            $mode = $parametersOrQueryMode;
            $parameters = null;
        } elseif (is_array($parametersOrQueryMode) || $parametersOrQueryMode instanceof ParameterContainer) {
            $mode = self::QUERY_MODE_PREPARE;
            $parameters = $parametersOrQueryMode;
        } else {
            throw new Exception\InvalidArgumentException('Parameter 2 to this method must be a flag, an array, or ParameterContainer');
        }

        if ($mode == self::QUERY_MODE_PREPARE) {
            $this->lastPreparedStatement = null;
            $this->lastPreparedStatement = $this->driver->createStatement($sql);
            $this->lastPreparedStatement->prepare();
            if (is_array($parameters) || $parameters instanceof ParameterContainer) {
                $this->lastPreparedStatement->setParameterContainer((is_array($parameters)) ? new ParameterContainer($parameters) : $parameters);
                $result = $this->lastPreparedStatement->execute();
            } else {
                return $this->lastPreparedStatement;
            }
        } else {
            $result = $this->driver->getConnection()->execute($sql);
        }

        if ($result instanceof Driver\ResultInterface && $result->isQueryResult()) {
            $resultSet = clone $this->queryResultSetPrototype;
            $resultSet->initialize($result);
            return $resultSet;
        }

        return $result;
    }

    /**
     * Create statement
     *
     * @param  string $initialSql
     * @param  ParameterContainer $initialParameters
     * @return Driver\StatementInterface
     */
    public function createStatement($initialSql = null, $initialParameters = null)
    {
        $statement = $this->driver->createStatement($initialSql);
        if ($initialParameters == null || !$initialParameters instanceof ParameterContainer && is_array($initialParameters)) {
            $initialParameters = new ParameterContainer((is_array($initialParameters) ? $initialParameters : array()));
        }
        $statement->setParameterContainer($initialParameters);
        return $statement;
    }

    public function getHelpers(/* $functions */)
    {
        $functions = array();
        $platform = $this->platform;
        foreach (func_get_args() as $arg) {
            switch ($arg) {
                case self::FUNCTION_QUOTE_IDENTIFIER:
                    $functions[] = function ($value) use ($platform) { return $platform->quoteIdentifier($value); };
                    break;
                case self::FUNCTION_QUOTE_VALUE:
                    $functions[] = function ($value) use ($platform) { return $platform->quoteValue($value); };
                    break;

            }
        }
    }

    /**
     * @param $name
     * @throws Exception\InvalidArgumentException
     * @return Driver\DriverInterface|Platform\PlatformInterface
     */
    public function __get($name)
    {
        switch (strtolower($name)) {
            case 'driver':
                return $this->driver;
            case 'platform':
                return $this->platform;
            default:
                throw new Exception\InvalidArgumentException('Invalid magic property on adapter');
        }

    }

    /**
     * @param array $parameters
     * @return Driver\DriverInterface
     * @throws \InvalidArgumentException
     * @throws Exception\InvalidArgumentException
     */
    protected function createDriver($parameters)
    {
        if (!isset($parameters['driver'])) {
            throw new Exception\InvalidArgumentException(__FUNCTION__ . ' expects a "driver" key to be present inside the parameters');
        }

        if ($parameters['driver'] instanceof Driver\DriverInterface) {
            return $parameters['driver'];
        }

        if (!is_string($parameters['driver'])) {
            throw new Exception\InvalidArgumentException(__FUNCTION__ . ' expects a "driver" to be a string or instance of DriverInterface');
        }

        $options = array();
        if (isset($parameters['options'])) {
            $options = (array) $parameters['options'];
            unset($parameters['options']);
        }

        $driverName = strtolower($parameters['driver']);
        switch ($driverName) {
            case 'mysqli':
                $driver = new Driver\Mysqli\Mysqli($parameters, null, null, $options);
                break;
            case 'sqlsrv':
                $driver = new Driver\Sqlsrv\Sqlsrv($parameters);
                break;
            case 'oci8':
                $driver = new Driver\Oci8\Oci8($parameters);
                break;
            case 'pgsql':
                $driver = new Driver\Pgsql\Pgsql($parameters);
                break;
            case 'ibmdb2':
                $driver = new Driver\IbmDb2\IbmDb2($parameters);
                break;
            case 'pdo':
            default:
                if ($driverName == 'pdo' || strpos($driverName, 'pdo') === 0) {
                    $driver = new Driver\Pdo\Pdo($parameters);
                }
        }

        if (!isset($driver) || !$driver instanceof Driver\DriverInterface) {
            throw new Exception\InvalidArgumentException('DriverInterface expected', null, null);
        }

        return $driver;
    }

    /**
     * @param Driver\DriverInterface $driver
     * @return Platform\PlatformInterface
     */
    protected function createPlatform($parameters)
    {
        if (isset($parameters['platform'])) {
            $platformName = $parameters['platform'];
        } elseif ($this->driver instanceof Driver\DriverInterface) {
            $platformName = $this->driver->getDatabasePlatformName(Driver\DriverInterface::NAME_FORMAT_CAMELCASE);
        } else {
            throw new Exception\InvalidArgumentException('A platform could not be determined from the provided configuration');
        }

        // currently only supported by the IbmDb2 & Oracle concrete implementations
        $options = (isset($parameters['platform_options'])) ? $parameters['platform_options'] : array();

        switch ($platformName) {
            case 'Mysql':
                // mysqli or pdo_mysql driver
                $driver = ($this->driver instanceof Driver\Mysqli\Mysqli || $this->driver instanceof Driver\Pdo\Pdo) ? $this->driver : null;
                return new Platform\Mysql($driver);
            case 'SqlServer':
                // PDO is only supported driver for quoting values in this platform
                return new Platform\SqlServer(($this->driver instanceof Driver\Pdo\Pdo) ? $this->driver : null);
            case 'Oracle':
                // oracle does not accept a driver as an option, no driver specific quoting available
                return new Platform\Oracle($options);
            case 'Sqlite':
                // PDO is only supported driver for quoting values in this platform
                return new Platform\Sqlite(($this->driver instanceof Driver\Pdo\Pdo) ? $this->driver : null);
            case 'Postgresql':
                // pgsql or pdo postgres driver
                $driver = ($this->driver instanceof Driver\Pgsql\Pgsql || $this->driver instanceof Driver\Pdo\Pdo) ? $this->driver : null;
                return new Platform\Postgresql($driver);
            case 'IbmDb2':
                // ibm_db2 driver escaping does not need an action connection
                return new Platform\IbmDb2($options);
            default:
                return new Platform\Sql92();
        }
    }

    protected function createProfiler($parameters)
    {
        if ($parameters['profiler'] instanceof Profiler\ProfilerInterface) {
            $profiler = $parameters['profiler'];
        } elseif (is_bool($parameters['profiler'])) {
            $profiler = ($parameters['profiler'] == true) ? new Profiler\Profiler : null;
        } else {
            throw new Exception\InvalidArgumentException(
                '"profiler" parameter must be an instance of ProfilerInterface or a boolean'
            );
        }
        return $profiler;
    }

    /**
     * @param array $parameters
     * @return Driver\DriverInterface
     * @throws \InvalidArgumentException
     * @throws Exception\InvalidArgumentException
     * @deprecated
     */
    protected function createDriverFromParameters(array $parameters)
    {
        return $this->createDriver($parameters);
    }

    /**
     * @param Driver\DriverInterface $driver
     * @return Platform\PlatformInterface
     * @deprecated
     */
    protected function createPlatformFromDriver(Driver\DriverInterface $driver)
    {
        return $this->createPlatform($driver);
    }
}
