<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql;

use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Adapter\Driver\DriverInterface;
use Zend\Db\Adapter\StatementContainerInterface;
use Zend\Db\Adapter\ParameterContainer;
use Zend\Db\Adapter\Platform\PlatformInterface;
use Zend\Db\Adapter\Platform\Sql92 as AdapterSql92Platform;

/**
 *
 * @property Where $where
 * @property Having $having
 */
class Select extends AbstractSql implements SqlInterface, PreparableSqlInterface
{
    /**#@+
     * Constant
     * @const
     */
    const SELECT = 'select';
    const QUANTIFIER = 'quantifier';
    const COLUMNS = 'columns';
    const TABLE = 'table';
    const JOINS = 'joins';
    const WHERE = 'where';
    const GROUP = 'group';
    const HAVING = 'having';
    const ORDER = 'order';
    const LIMIT = 'limit';
    const OFFSET = 'offset';
    const QUANTIFIER_DISTINCT = 'DISTINCT';
    const QUANTIFIER_ALL = 'ALL';
    const JOIN_INNER = 'inner';
    const JOIN_OUTER = 'outer';
    const JOIN_LEFT = 'left';
    const JOIN_RIGHT = 'right';
    const SQL_STAR = '*';
    const ORDER_ASCENDING = 'ASC';
    const ORDER_DESCENDING = 'DESC';
    const COMBINE = 'combine';
    const COMBINE_UNION = 'union';
    const COMBINE_EXCEPT = 'except';
    const COMBINE_INTERSECT = 'intersect';
    /**#@-*/

    /**
     * @var array Specifications
     */
    protected $specifications = array(
        'statementStart' => '%1$s',
        self::SELECT => array(
            'SELECT %1$s FROM %2$s' => array(
                array(1 => '%1$s', 2 => '%1$s AS %2$s', 'combinedby' => ', '),
                null
            ),
            'SELECT %1$s %2$s FROM %3$s' => array(
                null,
                array(1 => '%1$s', 2 => '%1$s AS %2$s', 'combinedby' => ', '),
                null
            ),
        ),
        self::JOINS  => array(
            '%1$s' => array(
                array(3 => '%1$s JOIN %2$s ON %3$s', 'combinedby' => ' ')
            )
        ),
        self::WHERE  => 'WHERE %1$s',
        self::GROUP  => array(
            'GROUP BY %1$s' => array(
                array(1 => '%1$s', 'combinedby' => ', ')
            )
        ),
        self::HAVING => 'HAVING %1$s',
        self::ORDER  => array(
            'ORDER BY %1$s' => array(
                array(1 => '%1$s', 2 => '%1$s %2$s', 'combinedby' => ', ')
            )
        ),
        self::LIMIT  => 'LIMIT %1$s',
        self::OFFSET => 'OFFSET %1$s',
        'statementEnd' => '%1$s',
        self::COMBINE => '%1$s ( %2$s )',
    );

    /**
     * @var bool
     */
    protected $tableReadOnly = false;

    /**
     * @var bool
     */
    protected $prefixColumnsWithTable = true;

    /**
     * @var string|array|TableIdentifier
     */
    protected $table = null;

    /**
     * @var null|string|Expression
     */
    protected $quantifier = null;

    /**
     * @var array
     */
    protected $columns = array(self::SQL_STAR);

    /**
     * @var array
     */
    protected $joins = array();

    /**
     * @var Where
     */
    protected $where = null;

    /**
     * @var array
     */
    protected $order = array();

    /**
     * @var null|array
     */
    protected $group = null;

    /**
     * @var null|string|array
     */
    protected $having = null;

    /**
     * @var int|null
     */
    protected $limit = null;

    /**
     * @var int|null
     */
    protected $offset = null;

    /**
     * @var array
     */
    protected $combine = array();

    /**
     * Constructor
     *
     * @param  null|string|array|TableIdentifier $table
     */
    public function __construct($table = null)
    {
        if ($table) {
            $this->from($table);
            $this->tableReadOnly = true;
        }

        $this->where = new Where;
        $this->having = new Having;
    }

    /**
     * Create from clause
     *
     * @param  string|array|TableIdentifier $table
     * @throws Exception\InvalidArgumentException
     * @return Select
     */
    public function from($table)
    {
        if ($this->tableReadOnly) {
            throw new Exception\InvalidArgumentException('Since this object was created with a table and/or schema in the constructor, it is read only.');
        }

        if (!is_string($table) && !is_array($table) && !$table instanceof TableIdentifier) {
            throw new Exception\InvalidArgumentException('$table must be a string, array, or an instance of TableIdentifier');
        }

        if (is_array($table) && (!is_string(key($table)) || count($table) !== 1)) {
            throw new Exception\InvalidArgumentException('from() expects $table as an array is a single element associative array');
        }

        $this->table = $table;
        return $this;
    }

    /**
     * @param string|Expression $quantifier DISTINCT|ALL
     * @return Select
     */
    public function quantifier($quantifier)
    {
        if (!is_string($quantifier) && !$quantifier instanceof Expression) {
            throw new Exception\InvalidArgumentException(
                'Quantifier must be one of DISTINCT, ALL, or some platform specific Expression object'
            );
        }
        $this->quantifier = $quantifier;
        return $this;
    }

    /**
     * Specify columns from which to select
     *
     * Possible valid states:
     *
     *   array(*)
     *
     *   array(value, ...)
     *     value can be strings or Expression objects
     *
     *   array(string => value, ...)
     *     key string will be use as alias,
     *     value can be string or Expression objects
     *
     * @param  array $columns
     * @param  bool  $prefixColumnsWithTable
     * @return Select
     */
    public function columns(array $columns, $prefixColumnsWithTable = true)
    {
        $this->columns = $columns;
        $this->prefixColumnsWithTable = (bool) $prefixColumnsWithTable;
        return $this;
    }

    /**
     * Create join clause
     *
     * @param  string|array $name
     * @param  string $on
     * @param  string|array $columns
     * @param  string $type one of the JOIN_* constants
     * @throws Exception\InvalidArgumentException
     * @return Select
     */
    public function join($name, $on, $columns = self::SQL_STAR, $type = self::JOIN_INNER)
    {
        if (is_array($name) && (!is_string(key($name)) || count($name) !== 1)) {
            throw new Exception\InvalidArgumentException(
                sprintf("join() expects '%s' as an array is a single element associative array", array_shift($name))
            );
        }
        if (!is_array($columns)) {
            $columns = array($columns);
        }
        $this->joins[] = array(
            'name'    => $name,
            'on'      => $on,
            'columns' => $columns,
            'type'    => $type
        );
        return $this;
    }

    /**
     * Create where clause
     *
     * @param  Where|\Closure|string|array|Predicate\PredicateInterface $predicate
     * @param  string $combination One of the OP_* constants from Predicate\PredicateSet
     * @throws Exception\InvalidArgumentException
     * @return Select
     */
    public function where($predicate, $combination = Predicate\PredicateSet::OP_AND)
    {
        if ($predicate instanceof Where) {
            $this->where = $predicate;
        } elseif ($predicate instanceof Predicate\PredicateInterface) {
            $this->where->addPredicate($predicate, $combination);
        } elseif ($predicate instanceof \Closure) {
            $predicate($this->where);
        } else {
            if (is_string($predicate)) {
                // String $predicate should be passed as an expression
                $predicate = (strpos($predicate, Expression::PLACEHOLDER) !== false)
                    ? new Predicate\Expression($predicate) : new Predicate\Literal($predicate);
                $this->where->addPredicate($predicate, $combination);
            } elseif (is_array($predicate)) {

                foreach ($predicate as $pkey => $pvalue) {
                    // loop through predicates

                    if (is_string($pkey) && strpos($pkey, '?') !== false) {
                        // First, process strings that the abstraction replacement character ?
                        // as an Expression predicate
                        $predicate = new Predicate\Expression($pkey, $pvalue);

                    } elseif (is_string($pkey)) {
                        // Otherwise, if still a string, do something intelligent with the PHP type provided

                        if ($pvalue === null) {
                            // map PHP null to SQL IS NULL expression
                            $predicate = new Predicate\IsNull($pkey, $pvalue);
                        } elseif (is_array($pvalue)) {
                            // if the value is an array, assume IN() is desired
                            $predicate = new Predicate\In($pkey, $pvalue);
                        } elseif ($pvalue instanceof Predicate\PredicateInterface) {
                            //
                            throw new Exception\InvalidArgumentException(
                                'Using Predicate must not use string keys'
                            );
                        } else {
                            // otherwise assume that array('foo' => 'bar') means "foo" = 'bar'
                            $predicate = new Predicate\Operator($pkey, Predicate\Operator::OP_EQ, $pvalue);
                        }
                    } elseif ($pvalue instanceof Predicate\PredicateInterface) {
                        // Predicate type is ok
                        $predicate = $pvalue;
                    } else {
                        // must be an array of expressions (with int-indexed array)
                        $predicate = (strpos($pvalue, Expression::PLACEHOLDER) !== false)
                            ? new Predicate\Expression($pvalue) : new Predicate\Literal($pvalue);
                    }
                    $this->where->addPredicate($predicate, $combination);
                }
            }
        }
        return $this;
    }

    public function group($group)
    {
        if (is_array($group)) {
            foreach ($group as $o) {
                $this->group[] = $o;
            }
        } else {
            $this->group[] = $group;
        }
        return $this;
    }

    /**
     * Create where clause
     *
     * @param  Where|\Closure|string|array $predicate
     * @param  string $combination One of the OP_* constants from Predicate\PredicateSet
     * @return Select
     */
    public function having($predicate, $combination = Predicate\PredicateSet::OP_AND)
    {
        if ($predicate instanceof Having) {
            $this->having = $predicate;
        } elseif ($predicate instanceof \Closure) {
            $predicate($this->having);
        } else {
            if (is_string($predicate)) {
                $predicate = new Predicate\Expression($predicate);
                $this->having->addPredicate($predicate, $combination);
            } elseif (is_array($predicate)) {
                foreach ($predicate as $pkey => $pvalue) {
                    if (is_string($pkey) && strpos($pkey, '?') !== false) {
                        $predicate = new Predicate\Expression($pkey, $pvalue);
                    } elseif (is_string($pkey)) {
                        $predicate = new Predicate\Operator($pkey, Predicate\Operator::OP_EQ, $pvalue);
                    } else {
                        $predicate = new Predicate\Expression($pvalue);
                    }
                    $this->having->addPredicate($predicate, $combination);
                }
            }
        }
        return $this;
    }

    /**
     * @param string|array $order
     * @return Select
     */
    public function order($order)
    {
        if (is_string($order)) {
            if (strpos($order, ',') !== false) {
                $order = preg_split('#,\s+#', $order);
            } else {
                $order = (array) $order;
            }
        } elseif (!is_array($order)) {
            $order = array($order);
        }
        foreach ($order as $k => $v) {
            if (is_string($k)) {
                $this->order[$k] = $v;
            } else {
                $this->order[] = $v;
            }
        }
        return $this;
    }

    /**
     * @param int $limit
     * @return Select
     */
    public function limit($limit)
    {
        if (!is_numeric($limit)) {
            throw new Exception\InvalidArgumentException(sprintf(
                '%s expects parameter to be numeric, "%s" given',
                __METHOD__,
                (is_object($limit) ? get_class($limit) : gettype($limit))
            ));
        }

        $this->limit = $limit;
        return $this;
    }

    /**
     * @param int $offset
     * @return Select
     */
    public function offset($offset)
    {
        if (!is_numeric($offset)) {
            throw new Exception\InvalidArgumentException(sprintf(
                '%s expects parameter to be numeric, "%s" given',
                __METHOD__,
                (is_object($offset) ? get_class($offset) : gettype($offset))
            ));
        }

        $this->offset = $offset;
        return $this;
    }

    /**
     * @param Select $select
     * @param string $type
     * @param string $modifier
     * @return Select
     * @throws Exception\InvalidArgumentException
     */
    public function combine(Select $select, $type = self::COMBINE_UNION, $modifier = '')
    {
        if ($this->combine !== array()) {
            throw new Exception\InvalidArgumentException('This Select object is already combined and cannot be combined with multiple Selects objects');
        }
        $this->combine = array(
            'select' => $select,
            'type' => $type,
            'modifier' => $modifier
        );
        return $this;
    }

    /**
     * @param string $part
     * @return Select
     * @throws Exception\InvalidArgumentException
     */
    public function reset($part)
    {
        switch ($part) {
            case self::TABLE:
                if ($this->tableReadOnly) {
                    throw new Exception\InvalidArgumentException(
                        'Since this object was created with a table and/or schema in the constructor, it is read only.'
                    );
                }
                $this->table = null;
                break;
            case self::QUANTIFIER:
                $this->quantifier = null;
                break;
            case self::COLUMNS:
                $this->columns = array();
                break;
            case self::JOINS:
                $this->joins = array();
                break;
            case self::WHERE:
                $this->where = new Where;
                break;
            case self::GROUP:
                $this->group = null;
                break;
            case self::HAVING:
                $this->having = new Having;
                break;
            case self::LIMIT:
                $this->limit = null;
                break;
            case self::OFFSET:
                $this->offset = null;
                break;
            case self::ORDER:
                $this->order = array();
                break;
            case self::COMBINE:
                $this->combine = array();
                break;
        }
        return $this;
    }

    public function setSpecification($index, $specification)
    {
        if (!method_exists($this, 'process' . $index)) {
            throw new Exception\InvalidArgumentException('Not a valid specification name.');
        }
        $this->specifications[$index] = $specification;
        return $this;
    }

    public function getRawState($key = null)
    {
        $rawState = array(
            self::TABLE      => $this->table,
            self::QUANTIFIER => $this->quantifier,
            self::COLUMNS    => $this->columns,
            self::JOINS      => $this->joins,
            self::WHERE      => $this->where,
            self::ORDER      => $this->order,
            self::GROUP      => $this->group,
            self::HAVING     => $this->having,
            self::LIMIT      => $this->limit,
            self::OFFSET     => $this->offset,
            self::COMBINE    => $this->combine
        );
        return (isset($key) && array_key_exists($key, $rawState)) ? $rawState[$key] : $rawState;
    }

    /**
     * Prepare statement
     *
     * @param AdapterInterface $adapter
     * @param StatementContainerInterface $statementContainer
     * @return void
     */
    public function prepareStatement(AdapterInterface $adapter, StatementContainerInterface $statementContainer)
    {
        // ensure statement has a ParameterContainer
        $parameterContainer = $statementContainer->getParameterContainer();
        if (!$parameterContainer instanceof ParameterContainer) {
            $parameterContainer = new ParameterContainer();
            $statementContainer->setParameterContainer($parameterContainer);
        }

        $sqls = array();
        $parameters = array();
        $platform = $adapter->getPlatform();
        $driver = $adapter->getDriver();

        foreach ($this->specifications as $name => $specification) {
            $parameters[$name] = $this->{'process' . $name}($platform, $driver, $parameterContainer, $sqls, $parameters);
            if ($specification && is_array($parameters[$name])) {
                $sqls[$name] = $this->createSqlFromSpecificationAndParameters($specification, $parameters[$name]);
            }
        }

        $sql = implode(' ', $sqls);

        $statementContainer->setSql($sql);
        return;
    }

    /**
     * Get SQL string for statement
     *
     * @param  null|PlatformInterface $adapterPlatform If null, defaults to Sql92
     * @return string
     */
    public function getSqlString(PlatformInterface $adapterPlatform = null)
    {
        // get platform, or create default
        $adapterPlatform = ($adapterPlatform) ?: new AdapterSql92Platform;

        $sqls = array();
        $parameters = array();

        foreach ($this->specifications as $name => $specification) {
            $parameters[$name] = $this->{'process' . $name}($adapterPlatform, null, null, $sqls, $parameters);
            if ($specification && is_array($parameters[$name])) {
                $sqls[$name] = $this->createSqlFromSpecificationAndParameters($specification, $parameters[$name]);
            }
        }

        $sql = implode(' ', $sqls);
        return $sql;
    }

    /**
     * Returns whether the table is read only or not.
     *
     * @return bool
     */
    public function isTableReadOnly()
    {
        return $this->tableReadOnly;
    }

    /**
     * Render table with alias in from/join parts
     *
     * @todo move TableIdentifier concatination here
     * @param string $table
     * @param string $alias
     * @return string
     */
    protected function renderTable($table, $alias = null)
    {
        $sql = $table;
        if ($alias) {
            $sql .= ' AS ' . $alias;
        }
        return $sql;
    }

    protected function processStatementStart(PlatformInterface $platform, DriverInterface $driver = null, ParameterContainer $parameterContainer = null)
    {
        if ($this->combine !== array()) {
            return array('(');
        }
    }

    protected function processStatementEnd(PlatformInterface $platform, DriverInterface $driver = null, ParameterContainer $parameterContainer = null)
    {
        if ($this->combine !== array()) {
            return array(')');
        }
    }

    /**
     * Process the select part
     *
     * @param PlatformInterface $platform
     * @param DriverInterface $driver
     * @param ParameterContainer $parameterContainer
     * @return null|array
     */
    protected function processSelect(PlatformInterface $platform, DriverInterface $driver = null, ParameterContainer $parameterContainer = null)
    {
        $expr = 1;

        if (!$this->table) {
            return null;
        }

        $table = $this->table;
        $schema = $alias = null;

        if (is_array($table)) {
            $alias = key($this->table);
            $table = current($this->table);
        }

        // create quoted table name to use in columns processing
        if ($table instanceof TableIdentifier) {
            list($table, $schema) = $table->getTableAndSchema();
        }

        if ($table instanceof Select) {
            $table = '(' . $this->processSubselect($table, $platform, $driver, $parameterContainer) . ')';
        } else {
            $table = $platform->quoteIdentifier($table);
        }

        if ($schema) {
            $table = $platform->quoteIdentifier($schema) . $platform->getIdentifierSeparator() . $table;
        }

        if ($alias) {
            $fromTable = $platform->quoteIdentifier($alias);
            $table = $this->renderTable($table, $fromTable);
        } else {
            $fromTable = $table;
        }

        if ($this->prefixColumnsWithTable) {
            $fromTable .= $platform->getIdentifierSeparator();
        } else {
            $fromTable = '';
        }

        // process table columns
        $columns = array();
        foreach ($this->columns as $columnIndexOrAs => $column) {

            $columnName = '';
            if ($column === self::SQL_STAR) {
                $columns[] = array($fromTable . self::SQL_STAR);
                continue;
            }

            if ($column instanceof Expression) {
                $columnParts = $this->processExpression(
                    $column,
                    $platform,
                    $driver,
                    $this->processInfo['paramPrefix'] . ((is_string($columnIndexOrAs)) ? $columnIndexOrAs : 'column')
                );
                if ($parameterContainer) {
                    $parameterContainer->merge($columnParts->getParameterContainer());
                }
                $columnName .= $columnParts->getSql();
            } else {
                $columnName .= $fromTable . $platform->quoteIdentifier($column);
            }

            // process As portion
            if (is_string($columnIndexOrAs)) {
                $columnAs = $platform->quoteIdentifier($columnIndexOrAs);
            } elseif (stripos($columnName, ' as ') === false) {
                $columnAs = (is_string($column)) ? $platform->quoteIdentifier($column) : 'Expression' . $expr++;
            }
            $columns[] = (isset($columnAs)) ? array($columnName, $columnAs) : array($columnName);
        }

        $separator = $platform->getIdentifierSeparator();

        // process join columns
        foreach ($this->joins as $join) {
            foreach ($join['columns'] as $jKey => $jColumn) {
                $jColumns = array();
                if ($jColumn instanceof ExpressionInterface) {
                    $jColumnParts = $this->processExpression(
                        $jColumn,
                        $platform,
                        $driver,
                        $this->processInfo['paramPrefix'] . ((is_string($jKey)) ? $jKey : 'column')
                    );
                    if ($parameterContainer) {
                        $parameterContainer->merge($jColumnParts->getParameterContainer());
                    }
                    $jColumns[] = $jColumnParts->getSql();
                } else {
                    $name = (is_array($join['name'])) ? key($join['name']) : $name = $join['name'];
                    if ($name instanceof TableIdentifier) {
                        $name = $platform->quoteIdentifier($name->getSchema()) . $separator . $platform->quoteIdentifier($name->getTable());
                    } else {
                        $name = $platform->quoteIdentifier($name);
                    }
                    $jColumns[] = $name . $separator . $platform->quoteIdentifierInFragment($jColumn);
                }
                if (is_string($jKey)) {
                    $jColumns[] = $platform->quoteIdentifier($jKey);
                } elseif ($jColumn !== self::SQL_STAR) {
                    $jColumns[] = $platform->quoteIdentifier($jColumn);
                }
                $columns[] = $jColumns;
            }
        }

        if ($this->quantifier) {
            if ($this->quantifier instanceof Expression) {
                $quantifierParts = $this->processExpression($this->quantifier, $platform, $driver, 'quantifier');
                if ($parameterContainer) {
                    $parameterContainer->merge($quantifierParts->getParameterContainer());
                }
                $quantifier = $quantifierParts->getSql();
            } else {
                $quantifier = $this->quantifier;
            }
        }

        if (isset($quantifier)) {
            return array($quantifier, $columns, $table);
        } else {
            return array($columns, $table);
        }
    }

    protected function processJoins(PlatformInterface $platform, DriverInterface $driver = null, ParameterContainer $parameterContainer = null)
    {
        if (!$this->joins) {
            return null;
        }

        // process joins
        $joinSpecArgArray = array();
        foreach ($this->joins as $j => $join) {
            $joinSpecArgArray[$j] = array();
            $joinName = null;
            $joinAs = null;

            // type
            $joinSpecArgArray[$j][] = strtoupper($join['type']);

            // table name
            if (is_array($join['name'])) {
                $joinName = current($join['name']);
                $joinAs = $platform->quoteIdentifier(key($join['name']));
            } else {
                $joinName = $join['name'];
            }
            if ($joinName instanceof TableIdentifier) {
                $joinName = $joinName->getTableAndSchema();
                $joinName = $platform->quoteIdentifier($joinName[1]) . $platform->getIdentifierSeparator() . $platform->quoteIdentifier($joinName[0]);
            } else {
                if ($joinName instanceof Select) {
                    $joinName = '(' . $joinName->processSubSelect($joinName, $platform, $driver, $parameterContainer) . ')';
                } else {
                    $joinName = $platform->quoteIdentifier($joinName);
                }
            }
            $joinSpecArgArray[$j][] = (isset($joinAs)) ? $joinName . ' AS ' . $joinAs : $joinName;

            // on expression
            // note: for Expression objects, pass them to processExpression with a prefix specific to each join (used for named parameters)
            $joinSpecArgArray[$j][] = ($join['on'] instanceof ExpressionInterface)
                ? $this->processExpression($join['on'], $platform, $driver, $this->processInfo['paramPrefix'] . 'join' . ($j+1) . 'part')
                : $platform->quoteIdentifierInFragment($join['on'], array('=', 'AND', 'OR', '(', ')', 'BETWEEN', '<', '>')); // on
            if ($joinSpecArgArray[$j][2] instanceof StatementContainerInterface) {
                if ($parameterContainer) {
                    $parameterContainer->merge($joinSpecArgArray[$j][2]->getParameterContainer());
                }
                $joinSpecArgArray[$j][2] = $joinSpecArgArray[$j][2]->getSql();
            }
        }

        return array($joinSpecArgArray);
    }

    protected function processWhere(PlatformInterface $platform, DriverInterface $driver = null, ParameterContainer $parameterContainer = null)
    {
        if ($this->where->count() == 0) {
            return null;
        }
        $whereParts = $this->processExpression($this->where, $platform, $driver, $this->processInfo['paramPrefix'] . 'where');
        if ($parameterContainer) {
            $parameterContainer->merge($whereParts->getParameterContainer());
        }
        return array($whereParts->getSql());
    }

    protected function processGroup(PlatformInterface $platform, DriverInterface $driver = null, ParameterContainer $parameterContainer = null)
    {
        if ($this->group === null) {
            return null;
        }
        // process table columns
        $groups = array();
        foreach ($this->group as $column) {
            $columnSql = '';
            if ($column instanceof Expression) {
                $columnParts = $this->processExpression($column, $platform, $driver, $this->processInfo['paramPrefix'] . 'group');
                if ($parameterContainer) {
                    $parameterContainer->merge($columnParts->getParameterContainer());
                }
                $columnSql .= $columnParts->getSql();
            } else {
                $columnSql .= $platform->quoteIdentifierInFragment($column);
            }
            $groups[] = $columnSql;
        }
        return array($groups);
    }

    protected function processHaving(PlatformInterface $platform, DriverInterface $driver = null, ParameterContainer $parameterContainer = null)
    {
        if ($this->having->count() == 0) {
            return null;
        }
        $whereParts = $this->processExpression($this->having, $platform, $driver, $this->processInfo['paramPrefix'] . 'having');
        if ($parameterContainer) {
            $parameterContainer->merge($whereParts->getParameterContainer());
        }
        return array($whereParts->getSql());
    }

    protected function processOrder(PlatformInterface $platform, DriverInterface $driver = null, ParameterContainer $parameterContainer = null)
    {
        if (empty($this->order)) {
            return null;
        }
        $orders = array();
        foreach ($this->order as $k => $v) {
            if ($v instanceof Expression) {
                /** @var $orderParts \Zend\Db\Adapter\StatementContainer */
                $orderParts = $this->processExpression($v, $platform, $driver);
                if ($parameterContainer) {
                    $parameterContainer->merge($orderParts->getParameterContainer());
                }
                $orders[] = array($orderParts->getSql());
                continue;
            }
            if (is_int($k)) {
                if (strpos($v, ' ') !== false) {
                    list($k, $v) = preg_split('# #', $v, 2);
                } else {
                    $k = $v;
                    $v = self::ORDER_ASCENDING;
                }
            }
            if (strtoupper($v) == self::ORDER_DESCENDING) {
                $orders[] = array($platform->quoteIdentifierInFragment($k), self::ORDER_DESCENDING);
            } else {
                $orders[] = array($platform->quoteIdentifierInFragment($k), self::ORDER_ASCENDING);
            }
        }
        return array($orders);
    }

    protected function processLimit(PlatformInterface $platform, DriverInterface $driver = null, ParameterContainer $parameterContainer = null)
    {
        if ($this->limit === null) {
            return null;
        }

        $limit = (int) $this->limit;

        if ($driver) {
            $sql = $driver->formatParameterName('limit');
            $parameterContainer->offsetSet('limit', $limit, ParameterContainer::TYPE_INTEGER);
        } else {
            $sql = $platform->quoteValue($limit);
        }

        return array($sql);
    }

    protected function processOffset(PlatformInterface $platform, DriverInterface $driver = null, ParameterContainer $parameterContainer = null)
    {
        if ($this->offset === null) {
            return null;
        }

        $offset = (int) $this->offset;

        if ($driver) {
            $parameterContainer->offsetSet('offset', $offset, ParameterContainer::TYPE_INTEGER);
            return array($driver->formatParameterName('offset'));
        }

        return array($platform->quoteValue($offset));
    }

    protected function processCombine(PlatformInterface $platform, DriverInterface $driver = null, ParameterContainer $parameterContainer = null)
    {
        if ($this->combine == array()) {
            return null;
        }

        $type = $this->combine['type'];
        if ($this->combine['modifier']) {
            $type .= ' ' . $this->combine['modifier'];
        }
        $type = strtoupper($type);

        if ($driver) {
            $sql = $this->processSubSelect($this->combine['select'], $platform, $driver, $parameterContainer);
            return array($type, $sql);
        }
        return array(
            $type,
            $this->processSubSelect($this->combine['select'], $platform)
        );
    }

    /**
     * Variable overloading
     *
     * @param  string $name
     * @throws Exception\InvalidArgumentException
     * @return mixed
     */
    public function __get($name)
    {
        switch (strtolower($name)) {
            case 'where':
                return $this->where;
            case 'having':
                return $this->having;
            default:
                throw new Exception\InvalidArgumentException('Not a valid magic property for this object');
        }
    }

    /**
     * __clone
     *
     * Resets the where object each time the Select is cloned.
     *
     * @return void
     */
    public function __clone()
    {
        $this->where  = clone $this->where;
        $this->having = clone $this->having;
    }
}
