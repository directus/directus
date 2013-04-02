<?php

namespace Directus\Db;

use Zend\Db\Sql\Sql;

use Directus\Application;
use Directus\Db\TableGateway\AclAwareTableGateway;

class Settings extends AclAwareTableGateway {

    public function fetchAll() {
        $sql = new Sql($this->adapter);
        $select = $sql->select()->from($this->table);
        $select->columns(array('collection','name','value'))
            ->order('collection');
        // Fetch row
        $statement = @$sql->prepareStatementForSqlObject($select); // @todo figure out this warning
        $rowset = $statement->execute();

        $result = array();
        foreach($rowset as $row) {
            $collection = $row['collection'];
            if(!array_key_exists($collection, $result))
                $result[$collection] = array();
            $result[$collection][$row['name']] = $row['value'];
        }
        return $result;
    }

}
