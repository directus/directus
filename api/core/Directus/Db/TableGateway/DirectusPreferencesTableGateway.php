<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Bootstrap;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Directus\Db\TableGateway\RelationalTableGateway;
use Directus\Db\TableSchema;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;

class DirectusPreferencesTableGateway extends AclAwareTableGateway {

    public static $_tableName = "directus_preferences";

    public function __construct(Acl $acl, AdapterInterface $adapter) {
        parent::__construct($acl, self::$_tableName, $adapter);
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
            "columns_visible"   => "name,title,caption,type,size,user,date_uploaded"
        )
    );

    public function applyDefaultPreferences($table, $preferences) {
        // Table-specific default values
        if(array_key_exists($table, self::$defaultPreferencesValuesByTable)) {
            $tableDefaultPreferences = self::$defaultPreferencesValuesByTable[$table];
            foreach($tableDefaultPreferences as $field => $defaultValue) {
                if(!isset($preferences[$field])) {
                    $preferences[$field] = $defaultValue;
                }
            }
        }
        // Global default values
        foreach(self::$defaultPreferencesValues as $field => $defaultValue) {
            if(!isset($preferences[$field]) || ("0" !== $preferences[$field] && empty($preferences[$field]))) {
                if(!isset($preferences[$field])) {
                    $preferences[$field] = $defaultValue;
                }
            }
        }
        return $preferences;
    }

    public function fetchByUserAndTable($user_id, $table) {
        $db = Bootstrap::get('olddb');
        $select = new Select($this->table);
        $select->limit(1);
        $select
            ->where
                ->equalTo('table_name', $table)
                ->equalTo('user', $user_id);
        $preferences = $this
            ->selectWith($select)
            ->current()
            ->toArray();

        if($preferences) {
            $newPreferencesData = false;

            // @todo enforce non-empty set
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
                $id = $this->addOrUpdateRecordByArray($preferences);
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
