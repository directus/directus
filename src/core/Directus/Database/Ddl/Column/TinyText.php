<?php

namespace Directus\Database\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\AbstractLengthColumn;

class TinyText extends AbstractLengthColumn
{
    /**
     * @var string
     */
    protected $type = 'TINYTEXT';
}
