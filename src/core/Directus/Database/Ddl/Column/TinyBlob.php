<?php

namespace Directus\Database\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\AbstractLengthColumn;

class TinyBlob extends AbstractLengthColumn
{
    /**
     * @var string
     */
    protected $type = 'TINYBLOB';
}
