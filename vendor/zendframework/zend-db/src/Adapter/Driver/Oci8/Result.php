<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Driver\Oci8;

use Iterator;
use Zend\Db\Adapter\Driver\ResultInterface;
use Zend\Db\Adapter\Exception;

class Result implements Iterator, ResultInterface
{
    /**
     * @var resource
     */
    protected $resource = null;

    /**
     * @var null|int
     */
    protected $rowCount = null;

    /**
     * Cursor position
     * @var int
     */
    protected $position = 0;

    /**
     * Number of known rows
     * @var int
     */
    protected $numberOfRows = -1;

    /**
     * Is the current() operation already complete for this pointer position?
     * @var bool
     */
    protected $currentComplete = false;

    /**
     * @var bool|array
     */
    protected $currentData = false;

    /**
     *
     * @var array
     */
    protected $statementBindValues = ['keys' => null, 'values' => []];

    /**
     * @var mixed
     */
    protected $generatedValue = null;

    /**
     * Initialize
     * @param resource $resource
     * @param null|int $generatedValue
     * @param null|int $rowCount
     * @return Result
     */
    public function initialize($resource, $generatedValue = null, $rowCount = null)
    {
        if (!is_resource($resource) && get_resource_type($resource) !== 'oci8 statement') {
            throw new Exception\InvalidArgumentException('Invalid resource provided.');
        }
        $this->resource = $resource;
        $this->generatedValue = $generatedValue;
        $this->rowCount = $rowCount;
        return $this;
    }

    /**
     * Force buffering at driver level
     *
     * Oracle does not support this, to my knowledge (@ralphschindler)
     *
     * @throws Exception\RuntimeException
     */
    public function buffer()
    {
        return;
    }

    /**
     * Is the result buffered?
     *
     * @return bool
     */
    public function isBuffered()
    {
        return false;
    }

    /**
     * Return the resource
     * @return mixed
     */
    public function getResource()
    {
        return $this->resource;
    }

    /**
     * Is query result?
     *
     * @return bool
     */
    public function isQueryResult()
    {
        return (oci_num_fields($this->resource) > 0);
    }

    /**
     * Get affected rows
     * @return int
     */
    public function getAffectedRows()
    {
        return oci_num_rows($this->resource);
    }

    /**
     * Current
     * @return mixed
     */
    public function current()
    {
        if ($this->currentComplete == false) {
            if ($this->loadData() === false) {
                return false;
            }
        }
        return $this->currentData;
    }

    /**
     * Load from oci8 result
     *
     * @return bool
     */
    protected function loadData()
    {
        $this->currentComplete = true;
        $this->currentData = oci_fetch_assoc($this->resource);
        if ($this->currentData !== false) {
            $this->position++;
            return true;
        }
        return false;
    }

    /**
     * Next
     */
    public function next()
    {
        return $this->loadData();
    }

    /**
     * Key
     * @return mixed
     */
    public function key()
    {
        return $this->position;
    }

    /**
     * Rewind
     */
    public function rewind()
    {
        if ($this->position > 0) {
            throw new Exception\RuntimeException('Oci8 results cannot be rewound for multiple iterations');
        }
    }

    /**
     * Valid
     * @return bool
     */
    public function valid()
    {
        if ($this->currentComplete) {
            return ($this->currentData !== false);
        }
        return $this->loadData();
    }

    /**
     * Count
     * @return null|int
     */
    public function count()
    {
        if (is_int($this->rowCount)) {
            return $this->rowCount;
        }
        if (is_callable($this->rowCount)) {
            $this->rowCount = (int) call_user_func($this->rowCount);
            return $this->rowCount;
        }
        return;
    }

    /**
     * @return int
     */
    public function getFieldCount()
    {
        return oci_num_fields($this->resource);
    }

    /**
     * @return null
     */
    public function getGeneratedValue()
    {
        // @todo OCI8 generated value in Driver Result
        return;
    }
}
