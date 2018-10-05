<?php

/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Driver\Sqlsrv;

use Zend\Db\Adapter\Driver\StatementInterface;
use Zend\Db\Adapter\Exception;
use Zend\Db\Adapter\ParameterContainer;
use Zend\Db\Adapter\Profiler;

class Statement implements StatementInterface, Profiler\ProfilerAwareInterface
{
    /**
     * @var resource
     */
    protected $sqlsrv = null;

    /**
     * @var Sqlsrv
     */
    protected $driver = null;

    /**
     * @var Profiler\ProfilerInterface
     */
    protected $profiler = null;

    /**
     * @var string
     */
    protected $sql = null;

    /**
     * @var bool
     */
    protected $isQuery = null;

    /**
     * @var array
     */
    protected $parameterReferences = [];

    /**
     * @var ParameterContainer
     */
    protected $parameterContainer = null;

    /**
     * @var resource
     */
    protected $resource = null;

    /**
     *
     * @var bool
     */
    protected $isPrepared = false;

    /**
     * @var array
     */
    protected $prepareParams = [];

    /**
     * @var array
     */
    protected $prepareOptions = [];

    /**
     * @var array
     */
    protected $parameterReferenceValues = [];

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
     * @param Profiler\ProfilerInterface $profiler
     * @return self Provides a fluent interface
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
     *
     * One of two resource types will be provided here:
     * a) "SQL Server Connection" when a prepared statement needs to still be produced
     * b) "SQL Server Statement" when a prepared statement has been already produced
     * (there will need to already be a bound param set if it applies to this query)
     *
     * @param resource $resource
     * @return self Provides a fluent interface
     * @throws Exception\InvalidArgumentException
     */
    public function initialize($resource)
    {
        $resourceType = get_resource_type($resource);

        if ($resourceType == 'SQL Server Connection') {
            $this->sqlsrv = $resource;
        } elseif ($resourceType == 'SQL Server Statement') {
            $this->resource = $resource;
            $this->isPrepared = true;
        } else {
            throw new Exception\InvalidArgumentException('Invalid resource provided to ' . __CLASS__);
        }

        return $this;
    }

    /**
     * Set parameter container
     *
     * @param ParameterContainer $parameterContainer
     * @return self Provides a fluent interface
     */
    public function setParameterContainer(ParameterContainer $parameterContainer)
    {
        $this->parameterContainer = $parameterContainer;
        return $this;
    }

    /**
     * @return ParameterContainer
     */
    public function getParameterContainer()
    {
        return $this->parameterContainer;
    }

    /**
     * @param $resource
     * @return self Provides a fluent interface
     */
    public function setResource($resource)
    {
        $this->resource = $resource;
        return $this;
    }

    /**
     * Get resource
     *
     * @return resource
     */
    public function getResource()
    {
        return $this->resource;
    }

    /**
     * @param string $sql
     * @return self Provides a fluent interface
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
     * @param string $sql
     * @param array $options
     * @return self Provides a fluent interface
     * @throws Exception\RuntimeException
     */
    public function prepare($sql = null, array $options = [])
    {
        if ($this->isPrepared) {
            throw new Exception\RuntimeException('Already prepared');
        }
        $sql = ($sql) ?: $this->sql;
        $options = ($options) ?: $this->prepareOptions;

        $pRef = &$this->parameterReferences;
        for ($position = 0, $count = substr_count($sql, '?'); $position < $count; $position++) {
            if (! isset($this->prepareParams[$position])) {
                $pRef[$position] = [&$this->parameterReferenceValues[$position], SQLSRV_PARAM_IN, null, null];
            } else {
                $pRef[$position] = &$this->prepareParams[$position];
            }
        }

        $this->resource = sqlsrv_prepare($this->sqlsrv, $sql, $pRef, $options);

        $this->isPrepared = true;

        return $this;
    }

    /**
     * @return bool
     */
    public function isPrepared()
    {
        return $this->isPrepared;
    }

    /**
     * Execute
     *
     * @param null|array|ParameterContainer $parameters
     * @throws Exception\RuntimeException
     * @return Result
     */
    public function execute($parameters = null)
    {
        /** END Standard ParameterContainer Merging Block */
        if (! $this->isPrepared) {
            $this->prepare();
        }

        /** START Standard ParameterContainer Merging Block */
        if (! $this->parameterContainer instanceof ParameterContainer) {
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
            $this->bindParametersFromContainer();
        }

        if ($this->profiler) {
            $this->profiler->profilerStart($this);
        }

        $resultValue = sqlsrv_execute($this->resource);

        if ($this->profiler) {
            $this->profiler->profilerFinish();
        }

        if ($resultValue === false) {
            $errors = sqlsrv_errors();
            // ignore general warnings
            if ($errors[0]['SQLSTATE'] != '01000') {
                throw new Exception\RuntimeException($errors[0]['message']);
            }
        }

        $result = $this->driver->createResult($this->resource);
        return $result;
    }

    /**
     * Bind parameters from container
     *
     */
    protected function bindParametersFromContainer()
    {
        $values = $this->parameterContainer->getPositionalArray();
        $position = 0;
        foreach ($values as $value) {
            $this->parameterReferences[$position++][0] = $value;
        }
    }

    /**
     * @param array $prepareParams
     */
    public function setPrepareParams(array $prepareParams)
    {
        $this->prepareParams = $prepareParams;
    }

    /**
     * @param array $prepareOptions
     */
    public function setPrepareOptions(array $prepareOptions)
    {
        $this->prepareOptions = $prepareOptions;
    }
}
