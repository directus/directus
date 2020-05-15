<?php

namespace Directus\Database\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\Integer;

class SmallInteger extends Integer
{
    /**
     * @var string
     */
    protected $type = 'SMALLINT';
}
