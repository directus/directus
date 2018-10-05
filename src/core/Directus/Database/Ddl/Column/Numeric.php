<?php

namespace Directus\Database\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\AbstractLengthColumn;

class Numeric extends AbstractLengthColumn
{
    /**
     * @var string
     */
    protected $type = 'NUMERIC';
}
