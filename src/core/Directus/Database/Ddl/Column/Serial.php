<?php

namespace Directus\Database\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\AbstractLengthColumn;

class Serial extends AbstractLengthColumn
{
    /**
     * @var string
     */
    protected $type = 'SERIAL';
}
