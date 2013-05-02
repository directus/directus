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

    public static $defaultPreferencesValues = array(
        "sort"          => "id",
        "sort_order"    => "ASC",
        "active"        => "1,2"
    );

    public static $defaultPreferencesValuesByTable = array(
        "directus_media" => array(
            "sort"              => "date_uploaded",
            "sort_order"        => "DESC",
            "columns_visible"   => "name,title,type,caption,size,user,date_uploaded"
        )
    );

    public function applyDefaultPreferences($table, $preferences) {
        // Table-specific default values
        if(array_key_exists($table, self::$defaultPreferencesValuesByTable)) {
            $tableDefaultPreferences = self::$defaultPreferencesValuesByTable[$table];
            foreach($tableDefaultPreferences as $field => $defaultValue) {
                $preferences[$field] = $defaultValue;
            }
        }
        // Global default values
        foreach(self::$defaultPreferencesValues as $field => $defaultValue) {
            if(!isset($preferences[$field]) || ("0" !== $preferences[$field] && empty($preferences[$field]))) {
                $preferences[$field] = $defaultValue;
            }
        }
        return $preferences;
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
            $newPreferencesData = false;

            // @todo enforce that the primary key is one of these
            // @todo & enforce non-empty set (Same thing!)
            if(empty($preferences['columns_visible'])) {
                $newPreferencesData = true;
                $columns_visible = TableSchema::getTableColumns($table, 6);
                $preferences['columns_visible'] = implode(',', $columns_visible);
            }

            $preferencesDefaultsApplied = $this->applyDefaultPreferences($table, $preferences);
            if(count(array_diff($preferences, $preferencesDefaultsApplied))) {
                $newPreferencesData = true;
            }
            $preferences = $preferencesDefaultsApplied;

            if($newPreferencesData) {
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
            'table_name' => $table
        );
        $data = $this->applyDefaultPreferences($table, $data);
        // Insert to DB
        $id = $db->set_entry(self::$_tableName, $data);
        return $data;
    }

}
