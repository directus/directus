<?php

namespace Directus\Database\Query\Relations;

use Directus\Database\Query\Builder;

class ManyToManyRelation extends Builder
{
    protected $parentBuilder;
    protected $table;
    protected $columnLeft;
    protected $columnRight;

    public function __construct(Builder $builder, $table, $columnLeft, $columnRight)
    {
        // compact('table', 'columnLeft', 'operator', 'columnLeft', 'value'));
        parent::__construct($builder->getConnection());

        $this->parentBuilder = $builder;
        $this->table = $table;
        $this->columnLeft = $columnLeft;
        $this->columnRight = $columnRight;

        $this->from($table);
    }
}