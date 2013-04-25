<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Bootstrap;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Directus\Db\TableSchema;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;

class DirectusPreferencesTableGateway extends AclAwareTableGateway {

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
        $rowset = $rowset->toArray();

        $db = Bootstrap::get('olddb');

        if(1 === count($rowset)) {
            $preferences = current($rowset);
            if(empty($preferences['columns_visible'])) {
                $columns_visible = TableSchema::getTableColumns($table, 6);
                $preferences['columns_visible'] = implode(',', $columns_visible);
                // Insert to DB
                $id = $db->set_entry(self::$_tableName, $preferences);
            }
            return $preferences;
        }

        // User doesn't have any preferences for this table yet. Please create!

        $columns_visible = TableSchema::getTableColumns($table, 6);

        $data = array(
            'user' => $user_id,
            'columns_visible' => implode(',', $columns_visible),
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
