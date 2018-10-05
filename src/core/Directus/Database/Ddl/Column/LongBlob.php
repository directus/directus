<?php

namespace Directus\Database\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\AbstractLengthColumn;

class LongBlob extends AbstractLengthColumn
{
    /**
     * @var string
     */
    protected $type = 'LONGBLOB';
}
