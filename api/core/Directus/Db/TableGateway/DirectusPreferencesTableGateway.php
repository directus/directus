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

class DirectusPreferencesTableGateway extends AclAwareTableGateway {

    public static $_tableName = "directus_preferences";

    public function __construct(Acl $acl, AdapterInterface $adapter) {
        parent::__construct($acl, self::$_tableName, $adapter);
    }

    public static $defaultPreferencesValues = array(
        "sort"          => "id",
        "sort_order"    => "ASC",
        "active"        => "1,2",
        "title"         => null
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

    public function constructPreferences($user_id, $table, $preferences = null, $title = null) {
        $db = Bootstrap::get('olddb');
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

        // User doesn't have any preferences for this table yet. Please create!
        $columns_visible = TableSchema::getTableColumns($table, 6);
        $data = array(
            'user' => $user_id,
            'columns_visible' => implode(',', $columns_visible),
            'table_name' => $table,
            'title' => $title
        );
        $data = $this->applyDefaultPreferences($table, $data);
        // Insert to DB
        $id = $db->set_entry(self::$_tableName, $data);

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
        $db = Bootstrap::get('olddb');

        $sql =
            'SELECT
                id,
                ST.table_name,
                user,
                columns_visible,
                sort,
                sort_order,
                active,
                title,
                search_string
            FROM
                INFORMATION_SCHEMA.TABLES ST
            LEFT JOIN
                directus_preferences ON (directus_preferences.table_name = ST.table_name AND directus_preferences.user = :user AND directus_preferences.title IS NULL)
            WHERE
                ST.TABLE_SCHEMA = :schema
            AND
                ST.TABLE_NAME NOT IN (
                    "directus_columns",
                    "directus_ip_whitelist",
                    "directus_preferences",
                    "directus_privileges",
                    "directus_settings",
                    "directus_social_feeds",
                    "directus_social_posts",
                    "directus_storage_adapters",
                    "directus_tables",
                    "directus_tab_privileges",
                    "directus_ui"
                )';

        $sth = $db->dbh->prepare($sql);
        $sth->bindValue(':schema', $db->db_name, \PDO::PARAM_STR);
        $sth->bindValue(':user', $user_id, \PDO::PARAM_INT);
        $sth->execute();

        $preferences = array();

        //Get Default Preferences
        while ($row = $sth->fetch(\PDO::FETCH_ASSOC)) {
            $tableName = $row['table_name'];

            // Honor ACL. Skip the tables that the user doesn't have access too
            if (!TableSchema::canGroupViewTable($tableName)) {
                continue;
            }

            if (!isset($row['user'])) {
                $row = null;
            }

            $row = $this->constructPreferences($user_id, $tableName, $row);
            $preferences[$tableName] = $row;
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
