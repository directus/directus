<?php

namespace Directus\Db;

use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;

use Directus\Application;
use Directus\Db\TableGateway\AclAwareTableGateway;

class Preferences extends AclAwareTableGateway {

    public function fetchByUserAndTable($user_id, $table) {
        $sql = new Sql($this->adapter);
        $select = $sql->select()
            ->from($this->table)
            ->limit(1);
        $select
            ->where
                ->equalTo('table_name', $table)
                ->AND
                ->equalTo('user', $user_id);
        // Fetch row
        $statement = @$sql->prepareStatementForSqlObject($select); // @todo figure out this warning
        $rowset = $statement->execute();
        if($row = $rowset->current())
            return $row;

        // @refactor
        // User doesn't have any preferences for this table yet. Please create!
        $sql = 'SELECT S.column_name, D.system, D.master
            FROM INFORMATION_SCHEMA.COLUMNS S
            LEFT JOIN directus_columns D
            ON (D.column_name = S.column_name AND D.table_name = S.table_name)
            WHERE S.table_name = :table_name';
        global $db;
        $sth = $db->dbh->prepare($sql);
        $sth->bindValue(':table_name', $tbl_name, PDO::PARAM_STR);
        $sth->execute();
        $columns_visible = array();
        while ($row = $sth->fetch(PDO::FETCH_ASSOC)) {
            if ($row['column_name'] != 'id' && $row['column_name'] != 'active' && $row['column_name'] != 'sort')
                array_push($columns_visible, $row['column_name']);
        }
        $data = array(
            'user' => $user_id,
            'columns_visible' => implode (',', $columns_visible),
            'table_name' => $tbl_name,
            'sort' => 'id',
            'sort_order' => 'asc',
            'active' => '1,2'
        );
        // Insert to DB
        $id = $db->set_entry('directus_preferences', $data);
        return $data;
    }

}
