<?php

namespace Directus\Database\Query\Relations;

use Directus\Database\Query\Builder;

class ManyToOneRelation extends Builder
{
    protected $parentBuilder;
    protected $column;
    protected $columnRight;
    protected $relatedTable;

    public function __construct(Builder $builder, $column, $relatedTable)
    {
        parent::__construct($builder->getConnection());

        $this->parentBuilder = $builder;
        $this->column = $column;
        $this->relatedTable = $relatedTable;

        $this->columns([$this->column]);
        $this->from($this->relatedTable);
    }
}
