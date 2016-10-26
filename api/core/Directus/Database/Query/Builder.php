<?php

namespace Directus\Database\Query;

use Directus\Database\Connection;
use Zend\Db\Sql\Predicate\In;
use Zend\Db\Sql\Predicate\Like;
use Zend\Db\Sql\Predicate\NotIn;
use Zend\Db\Sql\Predicate\NotLike;
use Zend\Db\Sql\Predicate\Operator;
use Zend\Db\Sql\Sql;

class Builder
{
    /**
     * @var \Directus\Database\Connection
     */
    protected $connection;

    /**
     * @var Sql
     */
    protected $sql = null;

    /**
     * @var array
     */
    protected $columns = ['*'];

    /**
     * @var string|null
     */
    protected $from;

    /**
     * @var array
     */
    protected $wheres = [];

    /**
     * @var array
     */
    protected $orders = [];

    /**
     * @var null|int
     */
    protected $offset = null;

    /**
     * @var null|int
     */
    protected $limit = null;

    /**
     * Builder constructor.
     *
     * @param Connection $connection
     */
    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    /**
     * Sets the columns list to be selected
     *
     * @param array $columns
     *
     * @return $this
     */
    public function columns(array $columns)
    {
        $this->columns = $columns;

        return $this;
    }

    /**
     * Gets the selected columns
     *
     * @return array
     */
    public function getColumns()
    {
        return $this->columns;
    }

    /**
     * Sets the from table
     *
     * @param $from
     *
     * @return $this
     */
    public function from($from)
    {
        $this->from = $from;

        return $this;
    }

    public function getFrom()
    {
        return $this->from;
    }

    /**
     * Sets a condition to the query
     *
     * @param $column
     * @param $operator
     * @param $value
     *
     * @return $this
     */
    public function where($column, $operator, $value)
    {
        $this->wheres[] = compact('operator', 'column', 'value');

        return $this;
    }

    /**
     * Sets a "where in" condition
     *
     * @param $column
     * @param array $values
     * @param bool $not
     *
     * @return Builder
     */
    public function whereIn($column, array $values, $not = false)
    {
        $operator = ($not === true ? 'n' : '') . 'in';

        return $this->where($column, $operator, $values);
    }

    /**
     * Sets an "where not in" condition
     *
     * @param $column
     * @param array $values
     *
     * @return Builder
     */
    public function whereNotIn($column, array $values)
    {
        return $this->whereIn($column, $values, true);
    }

    public function whereEqualTo($column, $value, $not = false)
    {
        $operator = $not !== true ? '=' : '<>';

        return $this->where($column, $operator, $value);
    }

    public function whereNotEqualTo($column, $value)
    {
        return $this->whereEqualTo($column, $value, true);
    }

    public function whereLessThan($column, $value)
    {
        return $this->where($column, '<', $value);
    }

    public function whereLessThanOrEqual($column, $value)
    {
        return $this->where($column, '<=', $value);
    }

    public function whereGreaterThan($column, $value)
    {
        return $this->where($column, '>', $value);
    }

    public function whereGreaterThanOrEqual($column, $value)
    {
        return $this->where($column, '>=', $value);
    }

    public function whereNull($column, $not = false)
    {
        return $this->whereEqualTo($column, null, $not);
    }

    public function whereNotNull($column)
    {
        return $this->whereNull($column, true);
    }

    public function whereLike($column, $value, $not = false)
    {
        $operator = ($not === true ? 'n' : '') . 'like';

        return $this->where($column, $operator, $value);
    }

    public function whereNotLike($column, $value)
    {
        return $this->whereLike($column, $value, true);
    }

    public function whereLLike($column, $value, $not = false)
    {
        $operator = ($not === true ? 'n' : '') . 'llike';

        return $this->where($column, $operator, $value);
    }

    public function whereNotLLike($column, $value)
    {
        return $this->whereLLike($column, $value, true);
    }

    public function whereRLike($column, $value, $not = false)
    {
        $operator = ($not === true ? 'n' : '') . 'rlike';

        return $this->where($column, $operator, $value);
    }

    public function whereNotRLike($column, $value)
    {
        return $this->whereRLike($column, $value, true);
    }

    /**
     * Gets the query conditions
     *
     * @return array
     */
    public function getWheres()
    {
        return $this->wheres;
    }

    /**
     * Order the query by the given table
     *
     * @param $column
     * @param string $direction
     *
     * @return Builder
     */
    public function orderBy($column, $direction = 'ASC')
    {
        $this->orders[(string) $column] = (string) $direction;

        return $this;
    }

    /**
     * Gets the sorts
     *
     * @return array
     */
    public function getOrders()
    {
        return $this->orders;
    }

    /**
     * Sets the number of records to skip
     *
     * @param $value
     *
     * @return Builder
     */
    public function offset($value)
    {
        $this->offset = max(0, $value);

        return $this;
    }

    /**
     * Alias of Builder::offset
     *
     * @param $value
     *
     * @return Builder
     */
    public function skip($value)
    {
        return $this->offset($value);
    }

    /**
     * Gets the query offset
     *
     * @return int|null
     */
    public function getOffset()
    {
        return $this->offset;
    }

    /**
     * Alias of Builder::getOffset
     *
     * @return int|null
     */
    public function getSkip()
    {
        return $this->getOffset();
    }

    /**
     * Sets the query result limit
     *
     * @param $value
     *
     * @return $this
     */
    public function limit($value)
    {
        // =============================================================================
        // LIMIT 0 quickly returns an empty set.
        // This can be useful for checking the validity of a query.
        // @see: http://dev.mysql.com/doc/refman/5.7/en/limit-optimization.html
        // =============================================================================
        if ($value >= 0) {
            $this->limit = (int) $value;
        } else {
            $this->limit = null;
        }

        return $this;
    }

    /**
     * Gets the query result limit
     *
     * @return int|null
     */
    public function getLimit()
    {
        return $this->limit;
    }

    /**
     * Build the Select Object
     *
     * @return \Zend\Db\Sql\Select
     */
    public function buildSelect()
    {
        $select = $this->getSqlObject()->select($this->getFrom());
        $select->columns($this->getColumns());
        $select->order($this->buildOrders());

        if ($this->getOffset() !== null) {
            $select->offset($this->getOffset());
        }

        if ($this->getLimit() !== null) {
            $select->limit($this->getLimit());
        }

        // Conditions
        foreach($this->getWheres() as $condition) {
            $select->where($this->buildConditionExpression($condition));
        }

        return $select;
    }

    public function get()
    {

    }

    protected function buildOrders()
    {
        $orders = [];
        foreach($this->getOrders() as $orderBy => $orderDirection) {
            $orders[] = sprintf('%s %s', $orderBy, $orderDirection);
        }

        return $orders;
    }

    protected function buildConditionExpression($condition)
    {
        $operator = $condition['operator'];
        $column = $condition['column'];
        $value = $condition['value'];

        switch($operator) {
            case 'in':
                $expression = new In($column, $value);
                break;
            case 'nin':
                $expression = new NotIn($column, $value);
                break;
            // @TODO: Create a wrapper object to extend Like Expression
            case 'like':
                $value = "%$value%";
                $expression = new Like($column, $value);
                break;
            case 'nlike':
                $value = "%$value%";
                $expression = new NotLike($column, $value);
                break;
            case 'rlike':
                $value = "$value%";
                $expression = new Like($column, $value);
                break;
            case 'nrlike':
                $value = "$value%";
                $expression = new NotLike($column, $value);
                break;
            case 'llike':
                $value = "%$value";
                $expression = new Like($column, $value);
                break;
            case 'nllike':
                $value = "%$value";
                $expression = new NotLike($column, $value);
                break;
            default:
                $expression = new Operator($column, $operator, $value);
        }

        return $expression;
    }

    protected function getSqlObject()
    {
        if ($this->sql === null) {
            $this->sql = new Sql($this->connection);
        }

        return $this->sql;
    }

    /**
     * Gets the connection
     *
     * @return Connection
     */
    public function getConnection()
    {
        return $this->connection;
    }
}