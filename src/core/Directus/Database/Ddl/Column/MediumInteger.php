<?php

namespace Directus\Database\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\Integer;

class MediumInteger extends Integer
{
    /**
     * @var string
     */
    protected $type = 'MEDIUMINT';
}
