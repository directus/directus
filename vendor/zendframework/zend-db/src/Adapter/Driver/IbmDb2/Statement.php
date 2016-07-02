<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Driver\IbmDb2;

use Zend\Db\Adapter\Driver\StatementInterface;
use Zend\Db\Adapter\Exception;
use Zend\Db\Adapter\ParameterContainer;
use Zend\Db\Adapter\Profiler;

class Statement implements StatementInterface, Profiler\ProfilerAwareInterface
{
    /**
     * @var resource
     */
    protected $db2 = null;

    /**
     * @var IbmDb2
     */
    protected $driver = null;

    /**
     * @var Profiler\ProfilerInterface
     */
    protected $profiler = null;

    /**
     * @var string
     */
    protected $sql = '';

    /**
     * @var ParameterContainer
     */
    protected $parameterContainer = null;

    /**
     * @var bool
     */
    protected $isPrepared = false;

    /**
     * @var resource
     */
    protected $resource = null;

    /**
     * @param $resource
     * @return Statement
     */
    public function initialize($resource)
    {
        $this->db2 = $resource;
        return $this;
    }

    /**
     * @param IbmDb2 $driver
     * @return Statement
     */
    public function setDriver(IbmDb2 $driver)
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
     * Set sql
     *
     * @param $sql
     * @return mixed
     */
    public function setSql($sql)
    {
        $this->sql = $sql;
        return $this;
    }

    /**
     * Get sql
     *
     * @return mixed
     */
    public function getSql()
    {
        return $this->sql;
    }

    /**
     * Set parameter container
     *
     * @param ParameterContainer $parameterContainer
     * @return mixed
     */
    public function setParameterContainer(ParameterContainer $parameterContainer)
    {
        $this->parameterContainer = $parameterContainer;
        return $this;
    }

    /**
     * Get parameter container
     *
     * @return mixed
     */
    public function getParameterContainer()
    {
        return $this->parameterContainer;
    }

    /**
     * @param $resource
     * @throws \Zend\Db\Adapter\Exception\InvalidArgumentException
     */
    public function setResource($resource)
    {
        if (get_resource_type($resource) !== 'DB2 Statement') {
            throw new Exception\InvalidArgumentException('Resource must be of type DB2 Statement');
        }
        $this->resource = $resource;
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
     * Prepare sql
     *
     * @param string|null $sql
     * @return Statement
     */
    public function prepare($sql = null)
    {
        if ($this->isPrepared) {
            throw new Exception\RuntimeException('This statement has been prepared already');
        }

        if ($sql == null) {
            $sql = $this->sql;
        }

        $this->resource = db2_prepare($this->db2, $sql);

        if ($this->resource === false) {
            throw new Exception\RuntimeException(db2_stmt_errormsg(), db2_stmt_error());
        }

        $this->isPrepared = true;
        return $this;
    }

    /**
     * Check if is prepared
     *
     * @return bool
     */
    public function isPrepared()
    {
        return $this->isPrepared;
    }

    /**
     * Execute
     *
     * @param null $parameters
     * @return Result
     */
    public function execute($parameters = null)
    {
        if (!$this->isPrepared) {
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
        /** END Standard ParameterContainer Merging Block */

        if ($this->profiler) {
            $this->profiler->profilerStart($this);
        }

        set_error_handler(function () {}, E_WARNING); // suppress warnings
        $response = db2_execute($this->resource, $this->parameterContainer->getPositionalArray());
        restore_error_handler();

        if ($this->profiler) {
            $this->profiler->profilerFinish();
        }

        if ($response === false) {
            throw new Exception\RuntimeException(db2_stmt_errormsg($this->resource));
        }

        $result = $this->driver->createResult($this->resource);
        return $result;
    }
}
