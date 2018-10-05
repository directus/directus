<?php

namespace Directus\Database\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\AbstractPrecisionColumn;

class Real extends AbstractPrecisionColumn
{
    /**
     * @var string
     */
    protected $type = 'REAL';
}
