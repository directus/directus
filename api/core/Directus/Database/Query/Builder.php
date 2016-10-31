<?php

namespace Directus\Database\Query;

use Directus\Database\Query\Relations\ManyToManyRelation;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\ResultSet\AbstractResultSet;
use Zend\Db\ResultSet\ResultSet;
use Zend\Db\Sql\Having;
use Zend\Db\Sql\Predicate\Expression;
use Zend\Db\Sql\Predicate\In;
use Zend\Db\Sql\Predicate\IsNotNull;
use Zend\Db\Sql\Predicate\IsNull;
use Zend\Db\Sql\Predicate\Like;
use Zend\Db\Sql\Predicate\NotIn;
use Zend\Db\Sql\Predicate\NotLike;
use Zend\Db\Sql\Predicate\Operator;
use Zend\Db\Sql\Sql;

class Builder
{
    /**
     * @var AdapterInterface
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
     * @var null|array
     */
    protected $groupBys = null;

    /**
     * @var null|array
     */
    protected $havings = null;

    /**
     * Builder constructor.
     *
     * @param AdapterInterface $connection
     */
    public function __construct(AdapterInterface $connection)
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

    /**
     * Gets the from table value
     *
     * @return null|string
     */
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
     * @param $not
     *
     * @return $this
     */
    public function where($column, $operator, $value, $not = false)
    {
        $this->wheres[] = compact('operator', 'column', 'value', 'not');

        return $this;
    }

    /**
     * Sets a "where in" condition
     *
     * @param $column
     * @param array|Builder $values
     * @param bool $not
     *
     * @return Builder
     */
    public function whereIn($column, $values, $not = false)
    {
        return $this->where($column, 'in', $values, $not);
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
        return $this->where($column, '=', $value, $not);
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
        return $this->where($column, 'null', null, $not);
    }

    public function whereNotNull($column)
    {
        return $this->whereNull($column, true);
    }

    public function whereLike($column, $value, $not = false)
    {
        return $this->where($column, 'like', $value, $not);
    }

    public function whereNotLike($column, $value)
    {
        return $this->whereLike($column, $value, true);
    }

    public function whereLLike($column, $value, $not = false)
    {
        return $this->where($column, 'llike', $value, $not);
    }

    public function whereNotLLike($column, $value)
    {
        return $this->whereLLike($column, $value, true);
    }

    public function whereRLike($column, $value, $not = false)
    {
        return $this->where($column, 'rlike', $value, $not);
    }

    public function whereNotRLike($column, $value)
    {
        return $this->whereRLike($column, $value, true);
    }

    public function whereAll($column, $table, $columnLeft, $columnRight, $values)
    {
        $relation = new ManyToManyRelation($this, $table, $columnLeft, $columnRight);

        $relation->columns([$columnLeft]);
        $relation->whereIn($columnRight, $values);
        $relation->groupBy($columnLeft);
        $relation->having(new Expression('COUNT(*) = ?', count($values)));

        return $this->whereIn($column, $relation);
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
     * Clears the orders list
     */
    public function clearOrders()
    {
        $this->orders = [];
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
     * Sets Group by columns
     *
     * @param array|string $columns
     */
    public function groupBy($columns)
    {
        if (!is_array($columns)) {
            $columns = [$columns];
        }

        if ($this->groupBys === null) {
            $this->groupBys = [];
        }

        foreach($columns as $column) {
            $this->groupBys[] = $column;
        }
    }

    /**
     * Sets having
     *
     * @param $column
     * @param $operator
     * @param $value
     *
     * @return $this
     */
    public function having($column, $operator = null, $value = null)
    {
        $this->havings[] = compact('column', 'operator', 'value');

        return $this;
    }

    /**
     * Gets havings
     *
     * @return array|null
     */
    public function getHavings()
    {
        return $this->havings;
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

        foreach($this->getWheres() as $condition) {
            $select->where($this->buildConditionExpression($condition));
        }

        if ($this->groupBys !== null) {
            $select->group($this->groupBys);
        }

        if ($this->getHavings() !== null) {
            foreach ($this->getHavings() as $having) {
                if ($having['column'] instanceof Expression) {
                    $expression = $having['column'];
                    $callback = function(Having $having) use ($expression) {
                        $having->addPredicate($expression);
                    };
                } else {
                    $callback = function(Having $havingObject) use ($having) {
                        $havingObject->addPredicate(new Operator($having['column'], $having['operator'], $having['value']));
                    };
                }

                $select->having($callback);
            }
        }

        return $select;
    }

    /**
     * Executes the query
     *
     * @return AbstractResultSet
     */
    public function get()
    {
        $sql = $this->getSqlObject();
        $select = $this->buildSelect();

        $statement = $sql->prepareStatementForSqlObject($select);
        $result = $statement->execute();

        $resultSet = new ResultSet($result);
        $resultSet->initialize($result);

        return $resultSet;
    }

    /**
     * Gets the query string
     *
     * @return string
     */
    public function getSql()
    {
        $sql = $this->getSqlObject();
        $select = $this->buildSelect();

        return $sql->getSqlStringForSqlObject($select, $this->connection->getPlatform());
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
        $not = $condition['not'] === true;
        $operator = ($not === true ? 'n' : '') . $condition['operator'];
        $column = $condition['column'];
        $value = $condition['value'];

        if ($value instanceof Builder) {
            $value = $value->buildSelect();
        }

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
            case 'null':
                $expression = new IsNull($column);
                break;
            case 'nnull':
                $expression = new IsNotNull($column);
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
     * @return AdapterInterface
     */
    public function getConnection()
    {
        return $this->connection;
    }
}