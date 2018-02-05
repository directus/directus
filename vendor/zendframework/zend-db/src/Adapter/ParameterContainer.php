<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter;

use ArrayAccess;
use Countable;
use Iterator;

class ParameterContainer implements Iterator, ArrayAccess, Countable
{
    const TYPE_AUTO    = 'auto';
    const TYPE_NULL    = 'null';
    const TYPE_DOUBLE  = 'double';
    const TYPE_INTEGER = 'integer';
    const TYPE_BINARY  = 'binary';
    const TYPE_STRING  = 'string';
    const TYPE_LOB     = 'lob';

    /**
     * Data
     *
     * @var array
     */
    protected $data = [];

    /**
     * @var array
     */
    protected $positions = [];

    /**
     * Errata
     *
     * @var array
     */
    protected $errata = [];

    /**
     * Max length
     *
     * @var array
     */
    protected $maxLength = [];

    /**
     * Constructor
     *
     * @param array $data
     */
    public function __construct(array $data = [])
    {
        if ($data) {
            $this->setFromArray($data);
        }
    }

    /**
     * Offset exists
     *
     * @param  string $name
     * @return bool
     */
    public function offsetExists($name)
    {
        return (isset($this->data[$name]));
    }

    /**
     * Offset get
     *
     * @param  string $name
     * @return mixed
     */
    public function offsetGet($name)
    {
        return (isset($this->data[$name])) ? $this->data[$name] : null;
    }

    /**
     * @param $name
     * @param $from
     */
    public function offsetSetReference($name, $from)
    {
        $this->data[$name] =& $this->data[$from];
    }

    /**
     * Offset set
     *
     * @param string|int $name
     * @param mixed $value
     * @param mixed $errata
     * @param mixed $maxLength
     * @throws Exception\InvalidArgumentException
     */
    public function offsetSet($name, $value, $errata = null, $maxLength = null)
    {
        $position = false;

        // if integer, get name for this position
        if (is_int($name)) {
            if (isset($this->positions[$name])) {
                $position = $name;
                $name = $this->positions[$name];
            } else {
                $name = (string) $name;
            }
        } elseif (is_string($name)) {
            // is a string:
            $position = array_key_exists($name, $this->data);
        } elseif ($name === null) {
            $name = (string) count($this->data);
        } else {
            throw new Exception\InvalidArgumentException('Keys must be string, integer or null');
        }

        if ($position === false) {
            $this->positions[] = $name;
        }

        $this->data[$name] = $value;

        if ($errata) {
            $this->offsetSetErrata($name, $errata);
        }

        if ($maxLength) {
            $this->offsetSetMaxLength($name, $maxLength);
        }
    }

    /**
     * Offset unset
     *
     * @param  string $name
     * @return self Provides a fluent interface
     */
    public function offsetUnset($name)
    {
        if (is_int($name) && isset($this->positions[$name])) {
            $name = $this->positions[$name];
        }
        unset($this->data[$name]);
        return $this;
    }

    /**
     * Set from array
     *
     * @param  array $data
     * @return self Provides a fluent interface
     */
    public function setFromArray(array $data)
    {
        foreach ($data as $n => $v) {
            $this->offsetSet($n, $v);
        }
        return $this;
    }

    /**
     * Offset set max length
     *
     * @param string|int $name
     * @param mixed $maxLength
     */
    public function offsetSetMaxLength($name, $maxLength)
    {
        if (is_int($name)) {
            $name = $this->positions[$name];
        }
        $this->maxLength[$name] = $maxLength;
    }

    /**
     * Offset get max length
     *
     * @param  string|int $name
     * @throws Exception\InvalidArgumentException
     * @return mixed
     */
    public function offsetGetMaxLength($name)
    {
        if (is_int($name)) {
            $name = $this->positions[$name];
        }
        if (! array_key_exists($name, $this->data)) {
            throw new Exception\InvalidArgumentException('Data does not exist for this name/position');
        }
        return $this->maxLength[$name];
    }

    /**
     * Offset has max length
     *
     * @param  string|int $name
     * @return bool
     */
    public function offsetHasMaxLength($name)
    {
        if (is_int($name)) {
            $name = $this->positions[$name];
        }
        return (isset($this->maxLength[$name]));
    }

    /**
     * Offset unset max length
     *
     * @param string|int $name
     * @throws Exception\InvalidArgumentException
     */
    public function offsetUnsetMaxLength($name)
    {
        if (is_int($name)) {
            $name = $this->positions[$name];
        }
        if (! array_key_exists($name, $this->maxLength)) {
            throw new Exception\InvalidArgumentException('Data does not exist for this name/position');
        }
        $this->maxLength[$name] = null;
    }

    /**
     * Get max length iterator
     *
     * @return \ArrayIterator
     */
    public function getMaxLengthIterator()
    {
        return new \ArrayIterator($this->maxLength);
    }

    /**
     * Offset set errata
     *
     * @param string|int $name
     * @param mixed $errata
     */
    public function offsetSetErrata($name, $errata)
    {
        if (is_int($name)) {
            $name = $this->positions[$name];
        }
        $this->errata[$name] = $errata;
    }

    /**
     * Offset get errata
     *
     * @param  string|int $name
     * @throws Exception\InvalidArgumentException
     * @return mixed
     */
    public function offsetGetErrata($name)
    {
        if (is_int($name)) {
            $name = $this->positions[$name];
        }
        if (! array_key_exists($name, $this->data)) {
            throw new Exception\InvalidArgumentException('Data does not exist for this name/position');
        }
        return $this->errata[$name];
    }

    /**
     * Offset has errata
     *
     * @param  string|int $name
     * @return bool
     */
    public function offsetHasErrata($name)
    {
        if (is_int($name)) {
            $name = $this->positions[$name];
        }
        return (isset($this->errata[$name]));
    }

    /**
     * Offset unset errata
     *
     * @param string|int $name
     * @throws Exception\InvalidArgumentException
     */
    public function offsetUnsetErrata($name)
    {
        if (is_int($name)) {
            $name = $this->positions[$name];
        }
        if (! array_key_exists($name, $this->errata)) {
            throw new Exception\InvalidArgumentException('Data does not exist for this name/position');
        }
        $this->errata[$name] = null;
    }

    /**
     * Get errata iterator
     *
     * @return \ArrayIterator
     */
    public function getErrataIterator()
    {
        return new \ArrayIterator($this->errata);
    }

    /**
     * getNamedArray
     *
     * @return array
     */
    public function getNamedArray()
    {
        return $this->data;
    }

    /**
     * getNamedArray
     *
     * @return array
     */
    public function getPositionalArray()
    {
        return array_values($this->data);
    }

    /**
     * count
     *
     * @return int
     */
    public function count()
    {
        return count($this->data);
    }

    /**
     * Current
     *
     * @return mixed
     */
    public function current()
    {
        return current($this->data);
    }

    /**
     * Next
     *
     * @return mixed
     */
    public function next()
    {
        return next($this->data);
    }

    /**
     * Key
     *
     * @return mixed
     */
    public function key()
    {
        return key($this->data);
    }

    /**
     * Valid
     *
     * @return bool
     */
    public function valid()
    {
        return (current($this->data) !== false);
    }

    /**
     * Rewind
     */
    public function rewind()
    {
        reset($this->data);
    }

    /**
     * @param array|ParameterContainer $parameters
     * @return self Provides a fluent interface
     * @throws Exception\InvalidArgumentException
     */
    public function merge($parameters)
    {
        if (! is_array($parameters) && ! $parameters instanceof ParameterContainer) {
            throw new Exception\InvalidArgumentException(
                '$parameters must be an array or an instance of ParameterContainer'
            );
        }

        if (count($parameters) == 0) {
            return $this;
        }

        if ($parameters instanceof ParameterContainer) {
            $parameters = $parameters->getNamedArray();
        }

        foreach ($parameters as $key => $value) {
            if (is_int($key)) {
                $key = null;
            }
            $this->offsetSet($key, $value);
        }
        return $this;
    }
}
