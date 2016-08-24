<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Driver\Pgsql;

use Zend\Db\Adapter\Driver\ResultInterface;
use Zend\Db\Adapter\Exception;

class Result implements ResultInterface
{

    /**
     * @var resource
     */
    protected $resource = null;

    /**
     * @var int
     */
    protected $position = 0;

    /**
     * @var int
     */
    protected $count = 0;

    /**
     * @var null|mixed
     */
    protected $generatedValue = null;

    /**
     * Initialize
     *
     * @param $resource
     * @param $generatedValue
     * @return void
     * @throws Exception\InvalidArgumentException
     */
    public function initialize($resource, $generatedValue)
    {
        if (!is_resource($resource) || get_resource_type($resource) != 'pgsql result') {
            throw new Exception\InvalidArgumentException('Resource not of the correct type.');
        }

        $this->resource = $resource;
        $this->count = pg_num_rows($this->resource);
        $this->generatedValue = $generatedValue;
    }

    /**
     * Current
     *
     * @return array|bool|mixed
     */
    public function current()
    {
        if ($this->count === 0) {
            return false;
        }
        return pg_fetch_assoc($this->resource, $this->position);
    }

    /**
     * Next
     *
     * @return void
     */
    public function next()
    {
        $this->position++;
    }

    /**
     * Key
     *
     * @return int|mixed
     */
    public function key()
    {
        return $this->position;
    }

    /**
     * Valid
     *
     * @return bool
     */
    public function valid()
    {
        return ($this->position < $this->count);
    }

    /**
     * Rewind
     *
     * @return void
     */
    public function rewind()
    {
        $this->position = 0;
    }

    /**
     * Buffer
     *
     * @return null
     */
    public function buffer()
    {
        return null;
    }

    /**
     * Is buffered
     *
     * @return false
     */
    public function isBuffered()
    {
        return false;
    }

    /**
     * Is query result
     *
     * @return bool
     */
    public function isQueryResult()
    {
        return (pg_num_fields($this->resource) > 0);
    }

    /**
     * Get affected rows
     *
     * @return int
     */
    public function getAffectedRows()
    {
        return pg_affected_rows($this->resource);
    }

    /**
     * Get generated value
     *
     * @return mixed|null
     */
    public function getGeneratedValue()
    {
        return $this->generatedValue;
    }

    /**
     * Get resource
     */
    public function getResource()
    {
        // TODO: Implement getResource() method.
    }

    /**
     * Count
     *
     * (PHP 5 &gt;= 5.1.0)<br/>
     * Count elements of an object
     * @link http://php.net/manual/en/countable.count.php
     * @return int The custom count as an integer.
     * </p>
     * <p>
     * The return value is cast to an integer.
     */
    public function count()
    {
        return $this->count;
    }

    /**
     * Get field count
     *
     * @return int
     */
    public function getFieldCount()
    {
        return pg_num_fields($this->resource);
    }
}
