<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Driver\Pdo;

use Iterator;
use PDOStatement;
use Zend\Db\Adapter\Driver\ResultInterface;
use Zend\Db\Adapter\Exception;

class Result implements Iterator, ResultInterface
{
    const STATEMENT_MODE_SCROLLABLE = 'scrollable';
    const STATEMENT_MODE_FORWARD    = 'forward';

    /**
     *
     * @var string
     */
    protected $statementMode = self::STATEMENT_MODE_FORWARD;

    /**
     * @var int
     */
    protected $fetchMode = \PDO::FETCH_ASSOC;

    /**
     * @var PDOStatement
     */
    protected $resource = null;

    /**
     * @var array Result options
     */
    protected $options;

    /**
     * Is the current complete?
     * @var bool
     */
    protected $currentComplete = false;

    /**
     * Track current item in recordset
     * @var mixed
     */
    protected $currentData = null;

    /**
     * Current position of scrollable statement
     * @var int
     */
    protected $position = -1;

    /**
     * @var mixed
     */
    protected $generatedValue = null;

    /**
     * @var null
     */
    protected $rowCount = null;

    /**
     * Initialize
     *
     * @param  PDOStatement $resource
     * @param               $generatedValue
     * @param  int          $rowCount
     * @return Result
     */
    public function initialize(PDOStatement $resource, $generatedValue, $rowCount = null)
    {
        $this->resource = $resource;
        $this->generatedValue = $generatedValue;
        $this->rowCount = $rowCount;

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
     * @return bool|null
     */
    public function isBuffered()
    {
        return false;
    }

    /**
     * @param int $fetchMode
     * @throws Exception\InvalidArgumentException on invalid fetch mode
     */
    public function setFetchMode($fetchMode)
    {
        if ($fetchMode < 1 || $fetchMode > 10) {
            throw new Exception\InvalidArgumentException(
                'The fetch mode must be one of the PDO::FETCH_* constants.'
            );
        }

        $this->fetchMode = (int) $fetchMode;
    }

    /**
     * @return int
     */
    public function getFetchMode()
    {
        return $this->fetchMode;
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
     * Get the data
     * @return array
     */
    public function current()
    {
        if ($this->currentComplete) {
            return $this->currentData;
        }

        $this->currentData = $this->resource->fetch($this->fetchMode);
        $this->currentComplete = true;
        return $this->currentData;
    }

    /**
     * Next
     *
     * @return mixed
     */
    public function next()
    {
        $this->currentData = $this->resource->fetch($this->fetchMode);
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
     * @throws Exception\RuntimeException
     * @return void
     */
    public function rewind()
    {
        if ($this->statementMode == self::STATEMENT_MODE_FORWARD && $this->position > 0) {
            throw new Exception\RuntimeException(
                'This result is a forward only result set, calling rewind() after moving forward is not supported'
            );
        }
        $this->currentData = $this->resource->fetch($this->fetchMode);
        $this->currentComplete = true;
        $this->position = 0;
    }

    /**
     * Valid
     *
     * @return bool
     */
    public function valid()
    {
        return ($this->currentData !== false);
    }

    /**
     * Count
     *
     * @return int
     */
    public function count()
    {
        if (is_int($this->rowCount)) {
            return $this->rowCount;
        }
        if ($this->rowCount instanceof \Closure) {
            $this->rowCount = (int) call_user_func($this->rowCount);
        } else {
            $this->rowCount = (int) $this->resource->rowCount();
        }
        return $this->rowCount;
    }

    /**
     * @return int
     */
    public function getFieldCount()
    {
        return $this->resource->columnCount();
    }

    /**
     * Is query result
     *
     * @return bool
     */
    public function isQueryResult()
    {
        return ($this->resource->columnCount() > 0);
    }

    /**
     * Get affected rows
     *
     * @return int
     */
    public function getAffectedRows()
    {
        return $this->resource->rowCount();
    }

    /**
     * @return mixed|null
     */
    public function getGeneratedValue()
    {
        return $this->generatedValue;
    }
}
