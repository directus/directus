<?php

namespace Directus\Db;

use Zend\Db\Sql\Sql;

use Directus\Application;

class Settings extends TableGateway {


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

        // $sth = $this->dbh->query("SELECT `collection`,`name`,`value` FROM directus_settings ORDER BY `collection");
        // $result = array();
        // while($row = $sth->fetch(PDO::FETCH_ASSOC)) {
        //     $result[$row['collection']][$row['name']] = $row['value'];
        // }
        // return $result;
    }

}
