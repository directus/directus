<?php

namespace Directus\Database\TableGateway;

use Directus\Database\TableSchema;
use Directus\Permissions\Acl;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Insert;
use Zend\Db\Sql\Predicate\NotIn;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Update;

class DirectusPreferencesTableGateway extends RelationalTableGateway
{
    public static $_tableName = 'directus_preferences';

    public $primaryKeyFieldName = 'id';

    /**
     * List of table that does not need preferences.
     *
     * @var array
     */
    public static $IGNORED_TABLES = [
        'columns',
        'preferences',
        'privileges',
        'settings',
        'tables',
        'ui'
    ];

    public function __construct(AdapterInterface $adapter, Acl $acl = null)
    {
        parent::__construct(self::$_tableName, $adapter, $acl);
    }

    public static $defaultPreferencesValues = [
        'sort' => 'id',
        'sort_order' => 'ASC',
        'status' => '1,2',
        'title' => null
    ];

    public static $defaultPreferencesValuesByTable = [
        'directus_files' => [
            'sort' => 'date_uploaded',
            'sort_order' => 'DESC',
            'columns_visible' => 'name,title,caption,type,size,user,date_uploaded'
        ]
    ];

    public function applyDefaultPreferences($table, $preferences)
    {
        // Table-specific default values
        if (array_key_exists($table, self::$defaultPreferencesValuesByTable)) {
            $tableDefaultPreferences = self::$defaultPreferencesValuesByTable[$table];
            foreach ($tableDefaultPreferences as $field => $defaultValue) {
                if (!isset($preferences[$field])) {
                    $preferences[$field] = $defaultValue;
                }
            }
        }

        // Global default values
        $primaryKeyFieldName = TableSchema::getTablePrimaryKey($table);
        if ($primaryKeyFieldName) {
            self::$defaultPreferencesValues['sort'] = $primaryKeyFieldName;
        }

        foreach (self::$defaultPreferencesValues as $field => $defaultValue) {
            if (!isset($preferences[$field]) || ('0' !== $preferences[$field] && empty($preferences[$field]))) {
                if (!isset($preferences[$field])) {
                    $preferences[$field] = $defaultValue;
                }
            }
        }

        if (isset($preferences['sort'])) {
            if (!TableSchema::hasTableSortColumn($table)) {
                $preferences['sort'] = TableSchema::getTableSortColumn($table);
            }
        }

        return $preferences;
    }

    public function constructPreferences($user_id, $table, $preferences = null, $title = null)
    {
        if ($preferences) {
            $newPreferencesData = false;

            // @todo enforce non-empty set
            if (empty($preferences['columns_visible'])) {
                $newPreferencesData = true;
                $columns_visible = TableSchema::getTableColumns($table, 6);
                $preferences['columns_visible'] = implode(',', $columns_visible);
            }

            $preferencesDefaultsApplied = $this->applyDefaultPreferences($table, $preferences);
            if (count(array_diff($preferences, $preferencesDefaultsApplied))) {
                $newPreferencesData = true;
            }
            $preferences = $preferencesDefaultsApplied;
            if ($newPreferencesData) {
                $id = $this->addOrUpdateRecordByArray($preferences);
            }
            return $preferences;
        }

        $insert = new Insert($this->table);

        // User doesn't have any preferences for this table yet. Please create!
        $columns_visible = TableSchema::getTableColumns($table, 6);
        $data = [
            'user' => $user_id,
            'columns_visible' => implode(',', $columns_visible),
            'table_name' => $table,
            'title' => $title
        ];

        if (TableSchema::hasTableSortColumn($table)) {
            $data['sort'] = TableSchema::getTableSortColumn($table);
        }

        $data = $this->applyDefaultPreferences($table, $data);

        $insert
            ->values($data);

        $this->insertWith($insert);

        return $data;
    }

    public function fetchByUserAndTableAndTitle($user_id, $table, $title = null)
    {
        $select = new Select($this->table);
        $select->limit(1);
        $select
            ->where
            ->equalTo('table_name', $table)
            ->equalTo('user', $user_id);

        if ($title) {
            $select->where->equalTo('title', $title);
        } else {
            $select->where->isNull('title');
        }

        $preferences = $this
            ->selectWith($select)
            ->current();

        if ($preferences) {
            $preferences = $preferences->toArray();
        }

        if ($preferences) {
            $preferences = $this->constructPreferences($user_id, $table, $preferences);
        }

        return $this->parseRecord($preferences);
    }

    /**
     * @deprecated
     * @param $user_id
     * @param $title
     * @return array
     */
    public function fetchByUserAndTitle($user_id, $title)
    {
        $result = $this->fetchEntityByUserAndTitle($user_id, $title);
        return (isset($result['data'])) ? $result['data'] : [];

    }

    /**
     * @param $user_id
     * @param $title
     * @return array|mixed
     */
    public function fetchEntityByUserAndTitle($user_id, $title)
    {
        // TODO: Merge with fetchByUserAndTableAndTitle

        $result = $this->getEntries([
            'single' => true,
            'filters' => [
                'user' => $user_id,
                'title' => $title
            ]
        ]);

        $result['data'] = ($result['data'])
            ? $this->constructPreferences($user_id, $result['data']['table_name'], $result['data']) : [];

        return $result;
    }

    /*
     * Temporary while I figured out why the method above
     * doesn't not construct preferences on table without preferences.
     */
    public function fetchByUserAndTable($user_id, $table)
    {
        $select = new Select($this->table);
        $select->limit(1);
        $select
            ->where
            ->equalTo('table_name', $table)
            ->equalTo('user', $user_id);

        $preferences = $this
            ->selectWith($select)
            ->current();

        if (!$preferences) {
            return $this->constructPreferences($user_id, $table);
        }

        if ($preferences) {
            $preferences = $preferences->toArray();
        }

        return $this->parseRecord($preferences);
    }

    public function updateDefaultByName($user_id, $table, $data)
    {
        $update = new Update($this->table);
        unset($data['id']);
        unset($data['title']);
        unset($data['table_name']);
        unset($data['user']);
        if (!isset($data) || !is_array($data)) {
            $data = [];
        }
        $update->set($data)
            ->where
            ->equalTo('table_name', $table)
            ->equalTo('user', $user_id)
            ->isNull('title');
        $this->updateWith($update);
    }

    // @param $assoc return associative array with table_name as keys
    public function fetchAllByUser($user_id, $assoc = false)
    {
        $select = new Select($this->table);
        $select->columns([
            'id',
            'user',
            'table_name',
            'columns_visible',
            'sort',
            'sort_order',
            'status',
            'title',
            'search_string',
            'list_view_options'
        ]);

        $select->where->equalTo('user', $user_id)
            ->isNull('title');

        $coreTables = $this->schemaManager->getDirectusTables(static::$IGNORED_TABLES);

        $select->where->addPredicate(new NotIn('table_name', $coreTables));
        $metadata = new \Zend\Db\Metadata\Metadata($this->getAdapter());

        $tables = $metadata->getTableNames();

        $tables = array_diff($tables, $coreTables);

        $rows = $this->selectWith($select)->toArray();

        $preferences = [];
        $tablePrefs = [];

        foreach ($rows as $row) {
            $tablePrefs[$row['table_name']] = $row;
        }

        //Get Default Preferences
        foreach ($tables as $key => $table) {
            // Honor ACL. Skip the tables that the user doesn't have access too
            if (!TableSchema::canGroupViewTable($table)) {
                continue;
            }

            $tableName = $table;

            if (!isset($tablePrefs[$table])) {
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

    public function fetchSavedPreferencesByUserAndTable($user_id, $table)
    {
        $select = new Select($this->table);
        $select
            ->where
            ->equalTo('table_name', $table)
            ->equalTo('user', $user_id)
            ->isNotNull('title');

        $preferences = $this
            ->selectWith($select);

        if ($preferences) {
            $preferences = $preferences->toArray();
        }

        return $preferences;
    }
}
