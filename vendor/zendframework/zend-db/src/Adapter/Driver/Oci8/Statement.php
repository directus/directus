<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Driver\Oci8;

use Zend\Db\Adapter\Driver\StatementInterface;
use Zend\Db\Adapter\Exception;
use Zend\Db\Adapter\ParameterContainer;
use Zend\Db\Adapter\Profiler;

class Statement implements StatementInterface, Profiler\ProfilerAwareInterface
{
    /**
     * @var resource
     */
    protected $oci8 = null;

    /**
     * @var Oci8
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
     * Parameter container
     *
     * @var ParameterContainer
     */
    protected $parameterContainer = null;

    /**
     * @var resource
     */
    protected $resource = null;

    /**
     * Is prepared
     *
     * @var bool
     */
    protected $isPrepared = false;

    /**
     * @var bool
     */
    protected $bufferResults = false;

    /**
     * Set driver
     *
     * @param  Oci8 $driver
     * @return Statement
     */
    public function setDriver($driver)
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
     * @param  resource $oci8
     * @return Statement
     */
    public function initialize($oci8)
    {
        $this->oci8 = $oci8;
        return $this;
    }

    /**
     * Set sql
     *
     * @param  string $sql
     * @return Statement
     */
    public function setSql($sql)
    {
        $this->sql = $sql;
        return $this;
    }

    /**
     * Set Parameter container
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
     * Get resource
     *
     * @return mixed
     */
    public function getResource()
    {
        return $this->resource;
    }

    /**
     * Set resource
     *
     * @param  resource $oci8Statement
     * @return Statement
     */
    public function setResource($oci8Statement)
    {
        $type = oci_statement_type($oci8Statement);
        if (false === $type || 'UNKNOWN' == $type) {
            throw new Exception\InvalidArgumentException(sprintf(
                'Invalid statement provided to %s',
                __METHOD__
            ));
        }
        $this->resource = $oci8Statement;
        $this->isPrepared = true;
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
     * @return ParameterContainer
     */
    public function getParameterContainer()
    {
        return $this->parameterContainer;
    }

    /**
     * @return bool
     */
    public function isPrepared()
    {
        return $this->isPrepared;
    }

    /**
     * @param string $sql
     * @return Statement
     */
    public function prepare($sql = null)
    {
        if ($this->isPrepared) {
            throw new Exception\RuntimeException('This statement has already been prepared');
        }

        $sql = ($sql) ?: $this->sql;

        // get oci8 statement resource
        $this->resource = oci_parse($this->oci8, $sql);

        if (!$this->resource) {
            $e = oci_error($this->oci8);
            throw new Exception\InvalidQueryException(
                'Statement couldn\'t be produced with sql: ' . $sql,
                null,
                new Exception\ErrorException($e['message'], $e['code'])
            );
        }

        $this->isPrepared = true;
        return $this;
    }

    /**
     * Execute
     *
     * @param null|array|ParameterContainer $parameters
     * @return mixed
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

        if ($this->parameterContainer->count() > 0) {
            $this->bindParametersFromContainer();
        }
        /** END Standard ParameterContainer Merging Block */

        if ($this->profiler) {
            $this->profiler->profilerStart($this);
        }

        if ($this->driver->getConnection()->inTransaction()) {
            $ret = @oci_execute($this->resource, OCI_NO_AUTO_COMMIT);
        } else {
            $ret = @oci_execute($this->resource, OCI_COMMIT_ON_SUCCESS);
        }

        if ($this->profiler) {
            $this->profiler->profilerFinish();
        }

        if ($ret === false) {
            $e = oci_error($this->resource);
            throw new Exception\RuntimeException($e['message'], $e['code']);
        }

        $result = $this->driver->createResult($this->resource, $this);
        return $result;
    }

    /**
     * Bind parameters from container
     *
     * @param ParameterContainer $pContainer
     */
    protected function bindParametersFromContainer()
    {
        $parameters = $this->parameterContainer->getNamedArray();

        foreach ($parameters as $name => &$value) {
            if ($this->parameterContainer->offsetHasErrata($name)) {
                switch ($this->parameterContainer->offsetGetErrata($name)) {
                    case ParameterContainer::TYPE_NULL:
                        $type = null;
                        $value = null;
                        break;
                    case ParameterContainer::TYPE_DOUBLE:
                    case ParameterContainer::TYPE_INTEGER:
                        $type = SQLT_INT;
                        if (is_string($value)) {
                            $value = (int) $value;
                        }
                        break;
                    case ParameterContainer::TYPE_BINARY:
                        $type = SQLT_BIN;
                        break;
                    case ParameterContainer::TYPE_LOB:
                        $type = OCI_B_CLOB;
                        $clob = oci_new_descriptor($this->driver->getConnection()->getResource(), OCI_DTYPE_LOB);
                        $clob->writetemporary($value, OCI_TEMP_CLOB);
                        $value = $clob;
                        break;
                    case ParameterContainer::TYPE_STRING:
                    default:
                        $type = SQLT_CHR;
                        break;
                }
            } else {
                $type = SQLT_CHR;
            }

            $maxLength = -1;
            if ($this->parameterContainer->offsetHasMaxLength($name)) {
                $maxLength = $this->parameterContainer->offsetGetMaxLength($name);
            }

            oci_bind_by_name($this->resource, $name, $value, $maxLength, $type);
        }
    }

    /**
     * Perform a deep clone
     */
    public function __clone()
    {
        $this->isPrepared = false;
        $this->parametersBound = false;
        $this->resource = null;
        if ($this->parameterContainer) {
            $this->parameterContainer = clone $this->parameterContainer;
        }
    }
}
