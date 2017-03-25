<?php

namespace Directus\Database\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\AbstractLengthColumn;

class Custom extends AbstractLengthColumn
{
    public function setType($type)
    {
        $this->type = $type;
    }
}
