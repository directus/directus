<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql;

use Zend\Db\Adapter\Driver\DriverInterface;
use Zend\Db\Adapter\ParameterContainer;
use Zend\Db\Adapter\Platform\PlatformInterface;

class Insert extends AbstractPreparableSql
{
    /**#@+
     * Constants
     *
     * @const
     */
    const SPECIFICATION_INSERT = 'insert';
    const SPECIFICATION_SELECT = 'select';
    const VALUES_MERGE = 'merge';
    const VALUES_SET   = 'set';
    /**#@-*/

    /**
     * @var array Specification array
     */
    protected $specifications = [
        self::SPECIFICATION_INSERT => 'INSERT INTO %1$s (%2$s) VALUES (%3$s)',
        self::SPECIFICATION_SELECT => 'INSERT INTO %1$s %2$s %3$s',
    ];

    /**
     * @var string|TableIdentifier
     */
    protected $table            = null;
    protected $columns          = [];

    /**
     * @var array|Select
     */
    protected $select           = null;

    /**
     * Constructor
     *
     * @param  null|string|TableIdentifier $table
     */
    public function __construct($table = null)
    {
        if ($table) {
            $this->into($table);
        }
    }

    /**
     * Create INTO clause
     *
     * @param  string|TableIdentifier $table
     * @return Insert
     */
    public function into($table)
    {
        $this->table = $table;
        return $this;
    }

    /**
     * Specify columns
     *
     * @param  array $columns
     * @return Insert
     */
    public function columns(array $columns)
    {
        $this->columns = array_flip($columns);
        return $this;
    }

    /**
     * Specify values to insert
     *
     * @param  array|Select $values
     * @param  string $flag one of VALUES_MERGE or VALUES_SET; defaults to VALUES_SET
     * @throws Exception\InvalidArgumentException
     * @return Insert
     */
    public function values($values, $flag = self::VALUES_SET)
    {
        if ($values instanceof Select) {
            if ($flag == self::VALUES_MERGE) {
                throw new Exception\InvalidArgumentException(
                    'A Zend\Db\Sql\Select instance cannot be provided with the merge flag'
                );
            }
            $this->select = $values;
            return $this;
        }

        if (!is_array($values)) {
            throw new Exception\InvalidArgumentException(
                'values() expects an array of values or Zend\Db\Sql\Select instance'
            );
        }

        if ($this->select && $flag == self::VALUES_MERGE) {
            throw new Exception\InvalidArgumentException(
                'An array of values cannot be provided with the merge flag when a Zend\Db\Sql\Select instance already exists as the value source'
            );
        }

        if ($flag == self::VALUES_SET) {
            $this->columns = $this->isAssocativeArray($values)
                ? $values
                : array_combine(array_keys($this->columns), array_values($values));
        } else {
            foreach ($values as $column => $value) {
                $this->columns[$column] = $value;
            }
        }
        return $this;
    }


    /**
     * Simple test for an associative array
     *
     * @link http://stackoverflow.com/questions/173400/how-to-check-if-php-array-is-associative-or-sequential
     * @param array $array
     * @return bool
     */
    private function isAssocativeArray(array $array)
    {
        return array_keys($array) !== range(0, count($array) - 1);
    }

    /**
     * Create INTO SELECT clause
     *
     * @param Select $select
     * @return self
     */
    public function select(Select $select)
    {
        return $this->values($select);
    }

    /**
     * Get raw state
     *
     * @param string $key
     * @return mixed
     */
    public function getRawState($key = null)
    {
        $rawState = [
            'table' => $this->table,
            'columns' => array_keys($this->columns),
            'values' => array_values($this->columns)
        ];
        return (isset($key) && array_key_exists($key, $rawState)) ? $rawState[$key] : $rawState;
    }

    protected function processInsert(PlatformInterface $platform, DriverInterface $driver = null, ParameterContainer $parameterContainer = null)
    {
        if ($this->select) {
            return;
        }
        if (!$this->columns) {
            throw new Exception\InvalidArgumentException('values or select should be present');
        }

        $columns = [];
        $values  = [];

        foreach ($this->columns as $column => $value) {
            $columns[] = $platform->quoteIdentifier($column);
            if (is_scalar($value) && $parameterContainer) {
                $values[] = $driver->formatParameterName($column);
                $parameterContainer->offsetSet($column, $value);
            } else {
                $values[] = $this->resolveColumnValue(
                    $value,
                    $platform,
                    $driver,
                    $parameterContainer
                );
            }
        }
        return sprintf(
            $this->specifications[static::SPECIFICATION_INSERT],
            $this->resolveTable($this->table, $platform, $driver, $parameterContainer),
            implode(', ', $columns),
            implode(', ', $values)
        );
    }

    protected function processSelect(PlatformInterface $platform, DriverInterface $driver = null, ParameterContainer $parameterContainer = null)
    {
        if (!$this->select) {
            return;
        }
        $selectSql = $this->processSubSelect($this->select, $platform, $driver, $parameterContainer);

        $columns = array_map([$platform, 'quoteIdentifier'], array_keys($this->columns));
        $columns = implode(', ', $columns);

        return sprintf(
            $this->specifications[static::SPECIFICATION_SELECT],
            $this->resolveTable($this->table, $platform, $driver, $parameterContainer),
            $columns ? "($columns)" : "",
            $selectSql
        );
    }

    /**
     * Overloading: variable setting
     *
     * Proxies to values, using VALUES_MERGE strategy
     *
     * @param  string $name
     * @param  mixed $value
     * @return Insert
     */
    public function __set($name, $value)
    {
        $this->columns[$name] = $value;
        return $this;
    }

    /**
     * Overloading: variable unset
     *
     * Proxies to values and columns
     *
     * @param  string $name
     * @throws Exception\InvalidArgumentException
     * @return void
     */
    public function __unset($name)
    {
        if (!array_key_exists($name, $this->columns)) {
            throw new Exception\InvalidArgumentException('The key ' . $name . ' was not found in this objects column list');
        }

        unset($this->columns[$name]);
    }

    /**
     * Overloading: variable isset
     *
     * Proxies to columns; does a column of that name exist?
     *
     * @param  string $name
     * @return bool
     */
    public function __isset($name)
    {
        return array_key_exists($name, $this->columns);
    }

    /**
     * Overloading: variable retrieval
     *
     * Retrieves value by column name
     *
     * @param  string $name
     * @throws Exception\InvalidArgumentException
     * @return mixed
     */
    public function __get($name)
    {
        if (!array_key_exists($name, $this->columns)) {
            throw new Exception\InvalidArgumentException('The key ' . $name . ' was not found in this objects column list');
        }
        return $this->columns[$name];
    }
}
