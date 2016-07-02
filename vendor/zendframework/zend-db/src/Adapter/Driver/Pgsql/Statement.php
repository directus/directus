<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Driver\Pgsql;

use Zend\Db\Adapter\Driver\StatementInterface;
use Zend\Db\Adapter\Exception;
use Zend\Db\Adapter\ParameterContainer;
use Zend\Db\Adapter\Profiler;

class Statement implements StatementInterface, Profiler\ProfilerAwareInterface
{
    /**
     * @var int
     */
    protected static $statementIndex = 0;

    /**
     * @var string
     */
    protected $statementName = '';

    /**
     * @var Pgsql
     */
    protected $driver = null;

    /**
     * @var Profiler\ProfilerInterface
     */
    protected $profiler = null;

    /**
     * @var resource
     */
    protected $pgsql = null;

    /**
     * @var resource
     */
    protected $resource = null;

    /**
     * @var string
     */
    protected $sql;

    /**
     * @var ParameterContainer
     */
    protected $parameterContainer;

    /**
     * @param  Pgsql $driver
     * @return Statement
     */
    public function setDriver(Pgsql $driver)
    {
        $this->driver = $driver;
        return $this;
    }

    /**
     * @param Profiler\ProfilerInterface $profiler
     * @return Statement
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
     * Initialize
     *
     * @param  resource $pgsql
     * @return void
     * @throws Exception\RuntimeException for invalid or missing postgresql connection
     */
    public function initialize($pgsql)
    {
        if (!is_resource($pgsql) || get_resource_type($pgsql) !== 'pgsql link') {
            throw new Exception\RuntimeException(sprintf(
                '%s: Invalid or missing postgresql connection; received "%s"',
                __METHOD__,
                get_resource_type($pgsql)
            ));
        }
        $this->pgsql = $pgsql;
    }

    /**
     * Get resource
     *
     * @return resource
     */
    public function getResource()
    {
        // TODO: Implement getResource() method.
    }

    /**
     * Set sql
     *
     * @param string $sql
     * @return Statement
     */
    public function setSql($sql)
    {
        $this->sql = $sql;
        return $this;
    }

    /**
     * Get sql
     *
     * @return string
     */
    public function getSql()
    {
        return $this->sql;
    }

    /**
     * Set parameter container
     *
     * @param ParameterContainer $parameterContainer
     * @return Statement
     */
    public function setParameterContainer(ParameterContainer $parameterContainer)
    {
        $this->parameterContainer = $parameterContainer;
        return $this;
    }

    /**
     * Get parameter container
     *
     * @return ParameterContainer
     */
    public function getParameterContainer()
    {
        return $this->parameterContainer;
    }

    /**
     * Prepare
     *
     * @param string $sql
     */
    public function prepare($sql = null)
    {
        $sql = ($sql) ?: $this->sql;

        $pCount = 1;
        $sql = preg_replace_callback(
            '#\$\##', function ($foo) use (&$pCount) {
                return '$' . $pCount++;
            },
            $sql
        );

        $this->sql = $sql;
        $this->statementName = 'statement' . ++static::$statementIndex;
        $this->resource = pg_prepare($this->pgsql, $this->statementName, $sql);
    }

    /**
     * Is prepared
     *
     * @return bool
     */
    public function isPrepared()
    {
        return isset($this->resource);
    }

    /**
     * Execute
     *
     * @param  ParameterContainer|null $parameters
     * @throws Exception\InvalidQueryException
     * @return Result
     */
    public function execute($parameters = null)
    {
        if (!$this->isPrepared()) {
            $this->prepare();
        }

        /** START Standard ParameterContainer Merging Block */
        if (!$this->parameterContainer instanceof ParameterContainer) {
            if ($parameters instanceof ParameterContainer) {
                $this->parameterContainer = $parameters;
                $parameters = null;
            } else {
                $this->parameterContainer = new ParameterContainer();
            }
        }

        if (is_array($parameters)) {
            $this->parameterContainer->setFromArray($parameters);
        }

        if ($this->parameterContainer->count() > 0) {
            $parameters = $this->parameterContainer->getPositionalArray();
        }
        /** END Standard ParameterContainer Merging Block */

        if ($this->profiler) {
            $this->profiler->profilerStart($this);
        }

        $resultResource = pg_execute($this->pgsql, $this->statementName, (array) $parameters);

        if ($this->profiler) {
            $this->profiler->profilerFinish();
        }

        if ($resultResource === false) {
            throw new Exception\InvalidQueryException(pg_last_error());
        }

        $result = $this->driver->createResult($resultResource);
        return $result;
    }
}
