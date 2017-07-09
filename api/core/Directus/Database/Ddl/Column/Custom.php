<?php

namespace Directus\Database\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\AbstractPrecisionColumn;

class Custom extends AbstractPrecisionColumn
{
    public function setType($type)
    {
        $this->type = $type;
    }
}
