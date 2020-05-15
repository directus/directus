<?php

namespace Directus\Database\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\AbstractLengthColumn;

class LongText extends AbstractLengthColumn
{
    /**
     * @var string
     */
    protected $type = 'LONGTEXT';
}
