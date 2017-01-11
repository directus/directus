<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Driver\Pgsql;

use Zend\Db\Adapter\Driver\DriverInterface;
use Zend\Db\Adapter\Exception;
use Zend\Db\Adapter\Profiler;

class Pgsql implements DriverInterface, Profiler\ProfilerAwareInterface
{
    /**
     * @var Connection
     */
    protected $connection = null;

    /**
     * @var Statement
     */
    protected $statementPrototype = null;

    /**
     * @var Result
     */
    protected $resultPrototype = null;

    /**
     * @var null|Profiler\ProfilerInterface
     */
    protected $profiler = null;

    /**
     * @var array
     */
    protected $options = [
        'buffer_results' => false
    ];

    /**
     * Constructor
     *
     * @param array|Connection|resource $connection
     * @param null|Statement $statementPrototype
     * @param null|Result $resultPrototype
     * @param array $options
     */
    public function __construct($connection, Statement $statementPrototype = null, Result $resultPrototype = null, $options = null)
    {
        if (!$connection instanceof Connection) {
            $connection = new Connection($connection);
        }

        $this->registerConnection($connection);
        $this->registerStatementPrototype(($statementPrototype) ?: new Statement());
        $this->registerResultPrototype(($resultPrototype) ?: new Result());
    }

    public function setProfiler(Profiler\ProfilerInterface $profiler)
    {
        $this->profiler = $profiler;
        if ($this->connection instanceof Profiler\ProfilerAwareInterface) {
            $this->connection->setProfiler($profiler);
        }
        if ($this->statementPrototype instanceof Profiler\ProfilerAwareInterface) {
            $this->statementPrototype->setProfiler($profiler);
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
     * Register connection
     *
     * @param Connection $connection
     * @return Pgsql
     */
    public function registerConnection(Connection $connection)
    {
        $this->connection = $connection;
        $this->connection->setDriver($this);
        return $this;
    }

    /**
     * Register statement prototype
     *
     * @param Statement $statement
     * @return Pgsql
     */
    public function registerStatementPrototype(Statement $statement)
    {
        $this->statementPrototype = $statement;
        $this->statementPrototype->setDriver($this); // needs access to driver to createResult()
        return $this;
    }

    /**
     * Register result prototype
     *
     * @param Result $result
     * @return Pgsql
     */
    public function registerResultPrototype(Result $result)
    {
        $this->resultPrototype = $result;
        return $this;
    }

    /**
     * Get database platform name
     *
     * @param string $nameFormat
     * @return string
     */
    public function getDatabasePlatformName($nameFormat = self::NAME_FORMAT_CAMELCASE)
    {
        if ($nameFormat == self::NAME_FORMAT_CAMELCASE) {
            return 'Postgresql';
        }

        return 'PostgreSQL';
    }

    /**
     * Check environment
     *
     * @throws Exception\RuntimeException
     * @return bool
     */
    public function checkEnvironment()
    {
        if (!extension_loaded('pgsql')) {
            throw new Exception\RuntimeException('The PostgreSQL (pgsql) extension is required for this adapter but the extension is not loaded');
        }
    }

    /**
     * Get connection
     *
     * @return Connection
     */
    public function getConnection()
    {
        return $this->connection;
    }

    /**
     * Create statement
     *
     * @param string|null $sqlOrResource
     * @return Statement
     */
    public function createStatement($sqlOrResource = null)
    {
        $statement = clone $this->statementPrototype;

        if (is_string($sqlOrResource)) {
            $statement->setSql($sqlOrResource);
        }

        if (!$this->connection->isConnected()) {
            $this->connection->connect();
        }

        $statement->initialize($this->connection->getResource());
        return $statement;
    }

    /**
     * Create result
     *
     * @param resource $resource
     * @return Result
     */
    public function createResult($resource)
    {
        $result = clone $this->resultPrototype;
        $result->initialize($resource, $this->connection->getLastGeneratedValue());
        return $result;
    }

    /**
     * Get prepare Type
     *
     * @return string
     */
    public function getPrepareType()
    {
        return self::PARAMETERIZATION_POSITIONAL;
    }

    /**
     * Format parameter name
     *
     * @param string $name
     * @param mixed  $type
     * @return string
     */
    public function formatParameterName($name, $type = null)
    {
        return '$#';
    }

    /**
     * Get last generated value
     *
     * @param string $name
     * @return mixed
     */
    public function getLastGeneratedValue($name = null)
    {
        return $this->connection->getLastGeneratedValue($name);
    }
}
