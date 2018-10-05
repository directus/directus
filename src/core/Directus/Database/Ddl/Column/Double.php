<?php

namespace Directus\Database\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\AbstractPrecisionColumn;

class Double extends AbstractPrecisionColumn
{
    /**
     * @var string
     */
    protected $type = 'DOUBLE';
}
