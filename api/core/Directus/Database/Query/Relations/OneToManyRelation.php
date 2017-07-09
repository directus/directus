<?php

namespace Directus\Database\Query\Relations;

use Directus\Database\Query\Builder;
use Zend\Db\Sql\Predicate\Expression;

class OneToManyRelation extends Builder
{
    protected $parentBuilder;
    protected $column;
    protected $table;
    protected $columnRight;
    protected $relatedTable;

    public function __construct(Builder $builder, $column, $table, $columnRight, $relatedTable)
    {
        parent::__construct($builder->getConnection());

        $this->parentBuilder = $builder;
        $this->column = $column;
        $this->table = $table;
        $this->columnRight = $columnRight;
        $this->relatedTable = $relatedTable;

        $this->columns([$this->column]);
        $this->from($relatedTable);
        $on = sprintf('%s.%s = %s.%s', $this->relatedTable, $this->column, $this->table, $this->columnRight);
        $this->join($this->table, $on, [$this->columnRight], 'right');
    }

    public function all(array $values)
    {
        $this->columns([]);
        $this->whereIn($this->table . '.' . $this->column, $values);
        $this->groupBy($this->columnRight);
        $this->having(new Expression('COUNT(*) = ?', count($values)));

        return $this;
    }

    public function has($count = 1)
    {
        $this->columns([]);
        $this->groupBy($this->columnRight);
        $this->having(new Expression('COUNT(*) >= ?', (int) $count));

        return $this;
    }

    public function whereLike($column, $value, $not = false, $logical = 'and')
    {
        $this->columns([]);
        parent::whereLike($this->table . '.' . $column, $value, $not, $logical);

        return $this;
    }

    public function orWhereLike($column, $value, $not = false)
    {
        $this->whereLike($column, $value, $not, 'or');

        return $this;
    }
}
