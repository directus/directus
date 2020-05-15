<?php

namespace Directus\Database\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\AbstractLengthColumn;

class MediumText extends AbstractLengthColumn
{
    /**
     * @var string
     */
    protected $type = 'MEDIUMTEXT';
}
