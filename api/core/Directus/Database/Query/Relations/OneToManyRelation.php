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

        $this->from($relatedTable);
    }

    public function all(array $values)
    {
        $this->columns([]);
        $on = sprintf('%s.%s = %s.%s', $this->relatedTable, $this->column, $this->table, $this->columnRight);
        $this->join($this->table, $on, [$this->columnRight], 'right');
        $this->whereIn($this->table . '.' . $this->column, $values);
        $this->groupBy($this->columnRight);
        $this->having(new Expression('COUNT(*) = ?', count($values)));

        return $this;
    }
}