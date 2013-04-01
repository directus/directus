<?php

namespace Directus\Db;

use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Expression;

class Users extends TableGateway {

    public function fetchAllWithGroupData() {

        $foreign_table = "directus_groups";
        $foreign_join_column = "directus_groups.id";
        $join_column = "directus_users.group";

        $sql = new Sql($this->adapter);
        $select = $sql->select();
        $select->from($this->table)
            ->join(
                $foreign_table,
                "$foreign_join_column = $join_column",
                array('group_name' => 'name'),
                $select::JOIN_LEFT
            );

        $statement = @$sql->prepareStatementForSqlObject($select); // @todo figure out this warning
        $rowset = $statement->execute();

        $results = array();
        foreach ($rowset as $row) {
            $row['group'] = array('id'=> (int) $row['group'], 'name' => $row['group_name']);
            unset($row['group_name']);
            $row['active'] = (int) $row['active'];
            array_push($results, $row);
        }
        return array('rows' => $results);
    }

}
