<?php

namespace Directus\Database\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\AbstractLengthColumn;

class MediumBlob extends AbstractLengthColumn
{
    /**
     * @var string
     */
    protected $type = 'MEDIUMBLOB';
}
