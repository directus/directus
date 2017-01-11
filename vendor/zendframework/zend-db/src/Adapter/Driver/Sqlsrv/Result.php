<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Driver\Sqlsrv;

use Iterator;
use Zend\Db\Adapter\Driver\ResultInterface;

class Result implements Iterator, ResultInterface
{
    /**
     * @var resource
     */
    protected $resource = null;

    /**
     * @var bool
     */
    protected $currentData = false;

    /**
     *
     * @var bool
     */
    protected $currentComplete = false;

    /**
     *
     * @var int
     */
    protected $position = -1;

    /**
     * @var mixed
     */
    protected $generatedValue = null;

    /**
     * Initialize
     *
     * @param  resource $resource
     * @param  mixed    $generatedValue
     * @return Result
     */
    public function initialize($resource, $generatedValue = null)
    {
        $this->resource = $resource;
        $this->generatedValue = $generatedValue;
        return $this;
    }

    /**
     * @return null
     */
    public function buffer()
    {
        return;
    }

    /**
     * @return bool
     */
    public function isBuffered()
    {
        return false;
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
     * Current
     *
     * @return mixed
     */
    public function current()
    {
        if ($this->currentComplete) {
            return $this->currentData;
        }

        $this->load();
        return $this->currentData;
    }

    /**
     * Next
     *
     * @return bool
     */
    public function next()
    {
        $this->load();
        return true;
    }

    /**
     * Load
     *
     * @param  int $row
     * @return mixed
     */
    protected function load($row = SQLSRV_SCROLL_NEXT)
    {
        $this->currentData = sqlsrv_fetch_array($this->resource, SQLSRV_FETCH_ASSOC, $row);
        $this->currentComplete = true;
        $this->position++;
        return $this->currentData;
    }

    /**
     * Key
     *
     * @return mixed
     */
    public function key()
    {
        return $this->position;
    }

    /**
     * Rewind
     *
     * @return bool
     */
    public function rewind()
    {
        $this->position = 0;
        $this->load(SQLSRV_SCROLL_FIRST);
        return true;
    }

    /**
     * Valid
     *
     * @return bool
     */
    public function valid()
    {
        if ($this->currentComplete && $this->currentData) {
            return true;
        }

        return $this->load();
    }

    /**
     * Count
     *
     * @return int
     */
    public function count()
    {
        return sqlsrv_num_rows($this->resource);
    }

    /**
     * @return bool|int
     */
    public function getFieldCount()
    {
        return sqlsrv_num_fields($this->resource);
    }

    /**
     * Is query result
     *
     * @return bool
     */
    public function isQueryResult()
    {
        if (is_bool($this->resource)) {
            return false;
        }
        return (sqlsrv_num_fields($this->resource) > 0);
    }

    /**
     * Get affected rows
     *
     * @return int
     */
    public function getAffectedRows()
    {
        return sqlsrv_rows_affected($this->resource);
    }

    /**
     * @return mixed|null
     */
    public function getGeneratedValue()
    {
        return $this->generatedValue;
    }
}
