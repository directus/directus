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
use Zend\Db\Sql\Update;
use Zend\Db\Sql\Insert;

class DirectusPreferencesTableGateway extends AclAwareTableGateway {

    public static $_tableName = "directus_preferences";

    public function __construct(Acl $acl, AdapterInterface $adapter) {
        parent::__construct($acl, self::$_tableName, $adapter);
    }

    public static $defaultPreferencesValues = array(
        "sort"          => "id",
        "sort_order"    => "ASC",
        STATUS_COLUMN_NAME        => "1,2",
        "title"         => null
    );

    public static $defaultPreferencesValuesByTable = array(
        "directus_files" => array(
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
        $primaryKeyFieldName = TableSchema::getTablePrimaryKey($table);
        if ($primaryKeyFieldName) {
            self::$defaultPreferencesValues['sort'] = $primaryKeyFieldName;
        }
        foreach(self::$defaultPreferencesValues as $field => $defaultValue) {
            if(!isset($preferences[$field]) || ("0" !== $preferences[$field] && empty($preferences[$field]))) {
                if(!isset($preferences[$field])) {
                    $preferences[$field] = $defaultValue;
                }
            }
        }
        if(isset($preferences['sort'])) {
            $sortColumn = $preferences['sort'];
            if (!TableSchema::hasTableColumn($table, $sortColumn)) {
                $preferences['sort'] = 'id';
            }
        }
        return $preferences;
    }

    public function constructPreferences($user_id, $table, $preferences = null, $title = null) {
        if ($preferences) {
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

        $insert = new Insert($this->table);

        // User doesn't have any preferences for this table yet. Please create!
        $columns_visible = TableSchema::getTableColumns($table, 6);
        $data = array(
            'user' => $user_id,
            'columns_visible' => implode(',', $columns_visible),
            'table_name' => $table,
            'title' => $title
        );
        if(TableSchema::hasTableColumn($table,'sort')) {
            $data['sort'] = 'sort';
        }
        $data = $this->applyDefaultPreferences($table, $data);

        $insert
          ->values($data);

        $this->insertWith($insert);

        return $data;
    }

    public function fetchByUserAndTableAndTitle($user_id, $table, $name = null) {
        $select = new Select($this->table);
        $select->limit(1);
        $select
            ->where
                ->equalTo('table_name', $table)
                ->equalTo('user', $user_id);

        if($name) {
            $select->where
                ->equalTo('title', $name);
        } else {
            $select->where
                ->isNull('title');
        }

        $preferences = $this
            ->selectWith($select)
            ->current();

        if($preferences) {
            $preferences = $preferences->toArray();
        }

        if($preferences) {
          return $this->constructPreferences($user_id, $table, $preferences);
        }

        return $preferences;
    }

    /*
     * Temporary while I figured out why the method above
     * doesn't not construct preferences on table without preferences.
     */
    public function fetchByUserAndTable($user_id, $table) {
        $select = new Select($this->table);
        $select->limit(1);
        $select
            ->where
                ->equalTo('table_name', $table)
                ->equalTo('user', $user_id);

        $preferences = $this
            ->selectWith($select)
            ->current();

        if(!$preferences) {
          return $this->constructPreferences($user_id, $table);
        }

        if($preferences) {
            $preferences = $preferences->toArray();
        }

        return $preferences;
    }

    public function updateDefaultByName($user_id, $table, $data) {
        $update = new Update($this->table);
        unset($data['id']);
        unset($data['title']);
        unset($data['table_name']);
        unset($data['user']);
        if(!isset($data) || !is_array($data)) {
          $data = array();
        }
        $update->set($data)
                ->where
                  ->equalTo('table_name', $table)
                  ->equalTo('user', $user_id)
                  ->isNull('title');
        $this->updateWith($update);
    }

    // @param $assoc return associative array with table_name as keys
    public function fetchAllByUser($user_id, $assoc = false) {
      $select = new Select($this->table);
      $select->columns(array('id', 'user', 'table_name', 'columns_visible', 'sort', 'sort_order', STATUS_COLUMN_NAME, 'title', 'search_string'));

      $select->where->equalTo('user', $user_id)
        ->isNull('title');
      $select->where('table_name NOT IN(
                    "directus_columns",
                    "directus_ip_whitelist",
                    "directus_preferences",
                    "directus_privileges",
                    "directus_settings",
                    "directus_storage_adapters",
                    "directus_tables",
                    "directus_tab_privileges",
                    "directus_ui"
                )');

      $metadata = new \Zend\Db\Metadata\Metadata($this->getAdapter());

      $tables = $metadata->getTableNames(DB_NAME);

      $tables = array_diff($tables, array("directus_columns",
                    "directus_ip_whitelist",
                    "directus_preferences",
                    "directus_privileges",
                    "directus_settings",
                    "directus_storage_adapters",
                    "directus_tables",
                    "directus_tab_privileges",
                    "directus_ui"
        ));

      $rows = $this->selectWith($select)->toArray();

      $preferences = array();
      $tablePrefs = array();

      foreach($rows as $row) {
        $tablePrefs[$row['table_name']] = $row;
      }

      //Get Default Preferences
      foreach($tables as $key=>$table) {
        // Honor ACL. Skip the tables that the user doesn't have access too
        if (!TableSchema::canGroupViewTable($table)) {
          continue;
        }

        $tableName = $table;

        if(!isset($tablePrefs[$table])) {
          $table = null;
        } else {
          $table = $tablePrefs[$table];
        }

        if (!isset($table['user'])) {
          $table = null;
        }

        $table = $this->constructPreferences($user_id, $tableName, $table);
        $preferences[$tableName] = $table;
      }

      return $preferences;
    }

    public function fetchSavedPreferencesByUserAndTable($user_id, $table) {
        $select = new Select($this->table);
        $select
            ->where
                ->equalTo('table_name', $table)
                ->equalTo('user', $user_id)
                ->isNotNull('title');

        $preferences = $this
            ->selectWith($select);

        if($preferences) {
            $preferences = $preferences->toArray();
        }

        return $preferences;
    }
}
