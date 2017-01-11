<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Driver;

use Zend\Db\Adapter\Profiler\ProfilerAwareInterface;
use Zend\Db\Adapter\Profiler\ProfilerInterface;

abstract class AbstractConnection implements ConnectionInterface, ProfilerAwareInterface
{
    /**
     * @var array
     */
    protected $connectionParameters = [];

    /**
     * @var string|null
     */
    protected $driverName;

    /**
     * @var boolean
     */
    protected $inTransaction = false;

    /**
     * Nested transactions count.
     *
     * @var integer
     */
    protected $nestedTransactionsCount = 0;

    /**
     * @var ProfilerInterface|null
     */
    protected $profiler;

    /**
     * @var resource|null
     */
    protected $resource;

    /**
     * {@inheritDoc}
     */
    public function disconnect()
    {
        if ($this->isConnected()) {
            $this->resource = null;
        }

        return $this;
    }

    /**
     * Get connection parameters
     *
     * @return array
     */
    public function getConnectionParameters()
    {
        return $this->connectionParameters;
    }

    /**
     * Get driver name
     *
     * @return null|string
     */
    public function getDriverName()
    {
        return $this->driverName;
    }

    /**
     * @return null|ProfilerInterface
     */
    public function getProfiler()
    {
        return $this->profiler;
    }

    /**
     * {@inheritDoc}
     *
     * @return resource
     */
    public function getResource()
    {
        if (!$this->isConnected()) {
            $this->connect();
        }

        return $this->resource;
    }

    /**
     * Checks whether the connection is in transaction state.
     *
     * @return boolean
     */
    public function inTransaction()
    {
        return $this->inTransaction;
    }

    /**
     * @param  array $connectionParameters
     * @return self
     */
    public function setConnectionParameters(array $connectionParameters)
    {
        $this->connectionParameters = $connectionParameters;

        return $this;
    }

    /**
     * {@inheritDoc}
     *
     * @return self
     */
    public function setProfiler(ProfilerInterface $profiler)
    {
        $this->profiler = $profiler;

        return $this;
    }
}
