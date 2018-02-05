<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\ResultSet;

use ArrayIterator;
use Countable;
use Iterator;
use IteratorAggregate;
use Zend\Db\Adapter\Driver\ResultInterface;

abstract class AbstractResultSet implements Iterator, ResultSetInterface
{
    /**
     * if -1, datasource is already buffered
     * if -2, implicitly disabling buffering in ResultSet
     * if false, explicitly disabled
     * if null, default state - nothing, but can buffer until iteration started
     * if array, already buffering
     * @var mixed
     */
    protected $buffer = null;

    /**
     * @var null|int
     */
    protected $count = null;

    /**
     * @var Iterator|IteratorAggregate|ResultInterface
     */
    protected $dataSource = null;

    /**
     * @var int
     */
    protected $fieldCount = null;

    /**
     * @var int
     */
    protected $position = 0;

    /**
     * Set the data source for the result set
     *
     * @param  array|Iterator|IteratorAggregate|ResultInterface $dataSource
     * @return self Provides a fluent interface
     * @throws Exception\InvalidArgumentException
     */
    public function initialize($dataSource)
    {
        // reset buffering
        if (is_array($this->buffer)) {
            $this->buffer = [];
        }

        if ($dataSource instanceof ResultInterface) {
            $this->fieldCount = $dataSource->getFieldCount();
            $this->dataSource = $dataSource;
            if ($dataSource->isBuffered()) {
                $this->buffer = -1;
            }
            if (is_array($this->buffer)) {
                $this->dataSource->rewind();
            }
            return $this;
        }

        if (is_array($dataSource)) {
            // its safe to get numbers from an array
            $first = current($dataSource);
            reset($dataSource);
            $this->fieldCount = count($first);
            $this->dataSource = new ArrayIterator($dataSource);
            $this->buffer = -1; // array's are a natural buffer
        } elseif ($dataSource instanceof IteratorAggregate) {
            $this->dataSource = $dataSource->getIterator();
        } elseif ($dataSource instanceof Iterator) {
            $this->dataSource = $dataSource;
        } else {
            throw new Exception\InvalidArgumentException(
                'DataSource provided is not an array, nor does it implement Iterator or IteratorAggregate'
            );
        }

        return $this;
    }

    /**
     * @return self Provides a fluent interface
     * @throws Exception\RuntimeException
     */
    public function buffer()
    {
        if ($this->buffer === -2) {
            throw new Exception\RuntimeException('Buffering must be enabled before iteration is started');
        } elseif ($this->buffer === null) {
            $this->buffer = [];
            if ($this->dataSource instanceof ResultInterface) {
                $this->dataSource->rewind();
            }
        }
        return $this;
    }

    public function isBuffered()
    {
        if ($this->buffer === -1 || is_array($this->buffer)) {
            return true;
        }
        return false;
    }

    /**
     * Get the data source used to create the result set
     *
     * @return null|Iterator
     */
    public function getDataSource()
    {
        return $this->dataSource;
    }

    /**
     * Retrieve count of fields in individual rows of the result set
     *
     * @return int
     */
    public function getFieldCount()
    {
        if (null !== $this->fieldCount) {
            return $this->fieldCount;
        }

        $dataSource = $this->getDataSource();
        if (null === $dataSource) {
            return 0;
        }

        $dataSource->rewind();
        if (! $dataSource->valid()) {
            $this->fieldCount = 0;
            return 0;
        }

        $row = $dataSource->current();
        if (is_object($row) && $row instanceof Countable) {
            $this->fieldCount = $row->count();
            return $this->fieldCount;
        }

        $row = (array) $row;
        $this->fieldCount = count($row);
        return $this->fieldCount;
    }

    /**
     * Iterator: move pointer to next item
     *
     * @return void
     */
    public function next()
    {
        if ($this->buffer === null) {
            $this->buffer = -2; // implicitly disable buffering from here on
        }
        if (! is_array($this->buffer) || $this->position == $this->dataSource->key()) {
            $this->dataSource->next();
        }
        $this->position++;
    }

    /**
     * Iterator: retrieve current key
     *
     * @return mixed
     */
    public function key()
    {
        return $this->position;
    }

    /**
     * Iterator: get current item
     *
     * @return array|null
     */
    public function current()
    {
        if (-1 === $this->buffer) {
            // datasource was an array when the resultset was initialized
            return $this->dataSource->current();
        }

        if ($this->buffer === null) {
            $this->buffer = -2; // implicitly disable buffering from here on
        } elseif (is_array($this->buffer) && isset($this->buffer[$this->position])) {
            return $this->buffer[$this->position];
        }
        $data = $this->dataSource->current();
        if (is_array($this->buffer)) {
            $this->buffer[$this->position] = $data;
        }
        return is_array($data) ? $data : null;
    }

    /**
     * Iterator: is pointer valid?
     *
     * @return bool
     */
    public function valid()
    {
        if (is_array($this->buffer) && isset($this->buffer[$this->position])) {
            return true;
        }
        if ($this->dataSource instanceof Iterator) {
            return $this->dataSource->valid();
        } else {
            $key = key($this->dataSource);
            return ($key !== null);
        }
    }

    /**
     * Iterator: rewind
     *
     * @return void
     */
    public function rewind()
    {
        if (! is_array($this->buffer)) {
            if ($this->dataSource instanceof Iterator) {
                $this->dataSource->rewind();
            } else {
                reset($this->dataSource);
            }
        }
        $this->position = 0;
    }

    /**
     * Countable: return count of rows
     *
     * @return int
     */
    public function count()
    {
        if ($this->count !== null) {
            return $this->count;
        }

        if ($this->dataSource instanceof Countable) {
            $this->count = count($this->dataSource);
        }

        return $this->count;
    }

    /**
     * Cast result set to array of arrays
     *
     * @return array
     * @throws Exception\RuntimeException if any row is not castable to an array
     */
    public function toArray()
    {
        $return = [];
        foreach ($this as $row) {
            if (is_array($row)) {
                $return[] = $row;
            } elseif (method_exists($row, 'toArray')) {
                $return[] = $row->toArray();
            } elseif (method_exists($row, 'getArrayCopy')) {
                $return[] = $row->getArrayCopy();
            } else {
                throw new Exception\RuntimeException(
                    'Rows as part of this DataSource, with type ' . gettype($row) . ' cannot be cast to an array'
                );
            }
        }
        return $return;
    }
}
