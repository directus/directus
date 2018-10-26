<?php

namespace Directus\Database\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\AbstractLengthColumn;

class Bit extends AbstractLengthColumn
{
    /**
     * @var string
     */
    protected $type = 'BIT';
}
