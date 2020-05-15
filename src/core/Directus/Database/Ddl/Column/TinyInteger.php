<?php

namespace Directus\Database\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\Integer;

class TinyInteger extends Integer
{
    /**
     * @var string
     */
    protected $type = 'TINYINT';
} 

