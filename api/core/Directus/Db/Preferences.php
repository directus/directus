<?php

namespace Directus\Db;

use Directus\Acl;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;

class Preferences extends AclAwareTableGateway {

    public static $_tableName = "directus_preferences";

    public function __construct(Acl $aclProvider, AdapterInterface $adapter) {
        parent::__construct($aclProvider, self::$_tableName, $adapter);
    }

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
        $rowset = $this->selectWith($select);
        if(1 === count($rowset))
            return current($rowset);

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
        $id = $db->set_entry(self::$_tableName, $data);
        return $data;
    }

}
