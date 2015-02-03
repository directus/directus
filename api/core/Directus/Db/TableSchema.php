<?php

namespace Directus\Db;

use Directus\Auth\Provider as Auth;
use Directus\Bootstrap;
use Directus\Db\TableGateway\DirectusPreferencesTableGateway;
use Directus\Db\TableGateway\RelationalTableGateway;
use Directus\Db\TableGateway\DirectusUiTableGateway;
use Directus\MemcacheProvider;

class TableSchema {

    public static $many_to_one_uis = array('many_to_one', 'single_files');

    // These columns types are aliases for "associations". They don't have
    // real, corresponding columns in the DB.
    public static $association_types = array('ONETOMANY','MANYTOMANY','ALIAS');

	protected $table;
	protected $db;
	protected $_loadedSchema;

    /**
     * TRANSITIONAL MAPPER. PENDING BUGFIX FOR MANY TO ONE UIS.
     * key: column_name
     * value: table_related
     * @see  https://github.com/RNGR/directus6/issues/188
     * @var array
     */
    public static $many_to_one_column_name_to_table_related = array(
        'group_id'          => 'directus_groups',
        'group'             => 'directus_groups',

        // These confound me. They'll be ignored and write silent warnings to the API log:
        // 'position'           => '',
        // 'many_to_one'        => '',
        // 'many_to_one_radios => ''
    );

    /**
     * TRANSITIONAL MAPPER. PENDING BUGFIX FOR MANY TO ONE UIS.
     * @see  https://github.com/RNGR/directus6/issues/188
     * @param  $column_name string
     * @return string
     */
    public static function getRelatedTableFromManyToOneColumnName($column_name) {
        if(!array_key_exists($column_name, self::$many_to_one_column_name_to_table_related)) {
            $log = Bootstrap::get('log');
            $log->warn("TRANSITIONAL MAPPER: Attempting to resolve unknown column name `$column_name` to a table_related value. Ignoring.");
            return;
        }
        return self::$many_to_one_column_name_to_table_related[$column_name];
    }

    protected static $_schemas = array();

    /**
     * @todo  for ALTER requests, caching schemas can't be allowed
     */
    public static function getSchemaArray($table, $params = null, $allowCache = true) {
        if(!$allowCache || !array_key_exists($table, self::$_schemas)) {
            self::$_schemas[$table] = self::loadSchema($table, $params);
        }

        return self::$_schemas[$table];
    }

    public static function getMasterColumn($schema) {
        foreach ($schema as $column) {
            if (isset($column['master']) && true == $column['master']) {
                return $column;
            }
        }
        return false;
    }

    public static function getFirstNonSystemColumn($schema) {
        foreach ($schema as $column) {
            if(isset($column['system']) && false != $column['system']) {
                continue;
            }
            return $column;
        }
        return false;
    }

    public static function columnIsCollectionAssociation($column) {
        return in_array($column['type'], self::$association_types);
    }

    public static function getAllNonAliasTableColumnNames($table) {
        $columnNames = array();
        $columns = self::getAllNonAliasTableColumns($table);
        if(false === $columns) {
            return false;
        }
        foreach($columns as $column) {
            $columnNames[] = $column['id'];
        }
        return $columnNames;
    }

    public static function getAllNonAliasTableColumns($table) {
        $columns = array();
        $schemaArray = self::loadSchema($table);
        if(false === $schemaArray) {
            return false;
        }
        foreach($schemaArray as $column) {
            if(self::columnIsCollectionAssociation($column)) {
                continue;
            }
            $columns[] = $column;
        }
        return $columns;
    }

    public static function getAllAliasTableColumns($table) {
        $columns = array();
        $schemaArray = self::loadSchema($table);
        foreach($schemaArray as $column) {
            if(!self::columnIsCollectionAssociation($column)) {
                continue;
            }
            $columns[] = $column;
        }
        return $columns;
    }

    public static function getTableColumns($table, $limit = null, $skipIgnore = false) {

        if(!self::canGroupViewTable($table)) {
            return array();
            // return false;
        }

        // Omit columns which are on this table's read field blacklist for the group of
        // the currently authenticated user.
        $acl = Bootstrap::get('acl');
        $readFieldBlacklist = $acl->getTablePrivilegeList($table, $acl::FIELD_READ_BLACKLIST);
        $readFieldBlacklist = implode(', ', $readFieldBlacklist);

        $sql = 'SELECT S.column_name, D.system, D.master
            FROM INFORMATION_SCHEMA.COLUMNS S
            LEFT JOIN directus_columns D
            ON (D.column_name = S.column_name AND D.table_name = S.table_name)
            WHERE
                S.table_name = :table_name AND
                S.table_schema = :table_schema AND
                S.column_name NOT IN (:field_read_blacklist)';

        $db = Bootstrap::get('olddb');
        $sth = $db->dbh->prepare($sql);
        $sth->bindValue(':table_name', $table, \PDO::PARAM_STR);
        $sth->bindValue(':table_schema', DB_NAME, \PDO::PARAM_STR);
        $sth->bindValue(':field_read_blacklist', $readFieldBlacklist, \PDO::PARAM_STR);
        $sth->execute();

        $columns = array();
        $ignoreColumns = ($skipIgnore !== true) ? array('id',STATUS_COLUMN_NAME,'sort') : array();
        $i = 0;
        while ($row = $sth->fetch(\PDO::FETCH_ASSOC)) {
            $i++;
            if(!in_array($row['column_name'], $ignoreColumns)) {
                array_push($columns, $row['column_name']);
            }
            if($i === $limit) {
                break;
            }
        }
        return $columns;
    }
    
    public static function hasTableColumn($table, $column) {
      $columns = self::getTableColumns($table, null, true);
      
      if (array_key_exists($column, array_flip($columns))) {
        return true;
      }
      
      return false;
    }

    public static function getUniqueColumnName($tbl_name) {
        // @todo for safe joins w/o name collision
    }


    /**
     * Get all table names
     *
     */
    public static function getTablenames($params=null) {
        $db = Bootstrap::get('olddb');

        $sql = 'SHOW TABLES';
        $sth = $db->dbh->prepare($sql);
        $sth->execute();

        $tables = array();

        while ($row = $sth->fetch(\PDO::FETCH_NUM)) {
            $name = $row[0];
            if(self::canGroupViewTable($name)) {
                $tables[] = $name;
            }
        }

        return $tables;
    }

    /**
     * Get info about all tables
     */
    public static function getTables($userGroupId, $versionHash) {
        $acl = Bootstrap::get('acl');
        $ZendDb = Bootstrap::get('ZendDb');
        $Preferences = new DirectusPreferencesTableGateway($acl, $ZendDb);
        $getTablesFn = function () use ($Preferences) {
            $return = array();
            $db = Bootstrap::get('olddb');
            $name = $db->db_name;
            $sql = 'SELECT S.TABLE_NAME as id
                FROM INFORMATION_SCHEMA.TABLES S
                WHERE
                    S.TABLE_SCHEMA = :schema AND
                    (S.TABLE_NAME NOT LIKE "directus\_%" OR
                    S.TABLE_NAME = "directus_activity" OR
                    S.TABLE_NAME = "directus_files" OR
                    S.TABLE_NAME = "directus_messages" OR
                    S.TABLE_NAME = "directus_groups" OR
                    S.TABLE_NAME = "directus_users" OR
                    S.TABLE_NAME = "directus_messages_recipients"
                    )
                GROUP BY S.TABLE_NAME
                ORDER BY S.TABLE_NAME';
            $sth = $db->dbh->prepare($sql);
            $sth->bindValue(':schema', $name, \PDO::PARAM_STR);
            $sth->execute();

            $currentUser = Auth::getUserInfo();

            while($row = $sth->fetch(\PDO::FETCH_ASSOC)) {
                if(!self::canGroupViewTable($row['id'])) {
                    continue;
                }
                $tbl["schema"] = self::getTable($row['id']);
                //$tbl["columns"] = $this->get_table($row['id']);
                $tbl["preferences"] = $Preferences->fetchByUserAndTable($currentUser['id'], $row['id']);
                // $tbl["preferences"] = $this->get_table_preferences($currentUser['id'], $row['id']);
                $return[] = $tbl;
            }
            return $return;
        };
        $cacheKey = MemcacheProvider::getKeyDirectusGroupSchema($userGroupId, $versionHash);
        $tables = $Preferences->memcache->getOrCache($cacheKey, $getTablesFn, 10800); // 3 hr cache
        return $tables;
    }

    public static function canGroupViewTable($tableName) {
        $acl = Bootstrap::get('acl');
        $tablePrivilegeList = $acl->getTablePrivilegeList($tableName, $acl::TABLE_PERMISSIONS);
        if(in_array('view', $tablePrivilegeList) || in_array('bigview', $tablePrivilegeList)) {
            return true;
        }
        return false;
    }

    public static function getTable($tbl_name) {
        $db = Bootstrap::get('olddb');
        $acl = Bootstrap::get('acl');
        $ZendDb = Bootstrap::get('ZendDb');

        if(!self::canGroupViewTable($tbl_name)) {
            return false;
        }

        $sql = "SELECT T.TABLE_NAME AS id,
            T.TABLE_NAME AS table_name,
            CREATE_TIME AS date_created,
            TABLE_COMMENT AS comment,
            ifnull(hidden,0) as hidden,
            ifnull(single,0) as single,
            default_status,
            is_junction_table,
            user_create_column,
            user_update_column,
            date_create_column,
            date_update_column,
            footer,
            TABLE_ROWS AS count
            FROM INFORMATION_SCHEMA.TABLES T
            LEFT JOIN directus_tables DT ON (DT.table_name = T.TABLE_NAME)
            WHERE T.TABLE_SCHEMA = :schema AND T.TABLE_NAME = :table_name";
        $sth = $db->dbh->prepare($sql);
        $sth->bindValue(':table_name', $tbl_name, \PDO::PARAM_STR);
        $sth->bindValue(':schema', $db->db_name, \PDO::PARAM_STR);
        $sth->execute();
        $info = $sth->fetch(\PDO::FETCH_ASSOC);
        if ($info) {
            $info['hidden'] = (boolean) $info['hidden'];
            $info['single'] = (boolean) $info['single'];
            $info['footer'] = (boolean) $info['footer'];
            $info['is_junction_table'] = (boolean) $info['is_junction_table'];
        }
        $relationalTableGateway = new RelationalTableGateway($acl, $tbl_name, $ZendDb);
        $info = array_merge($info, $relationalTableGateway->countActiveOld());

        $info['columns'] = self::getSchemaArray($tbl_name);
        return $info;
    }

    protected static function createParamArray($values, $prefix) {
        $result = array();

        foreach($values as $i => $field) {
            $result[$prefix.$i] = $field;
        }

        return $result;
    }

    /**
     * Get table structure
     * @param $tbl_name
     * @param $params
     */
    protected static function loadSchema($tbl_name, $params = null) {

        // Omit columns which are on this table's read field blacklist for the group of
        // the currently authenticated user.
        $acl = Bootstrap::get('acl');

        if(!self::canGroupViewTable($tbl_name)) {
            // return array();
            return false;
        }

        $readFieldBlacklist = $acl->getTablePrivilegeList($tbl_name, $acl::FIELD_READ_BLACKLIST);
        $readFieldBlacklistParams = self::createParamArray($readFieldBlacklist, ':readfield_blacklist_');
        $readFieldBlacklistKeys = implode(',', array_keys($readFieldBlacklistParams));

        if (empty($readFieldBlacklistKeys)) {
            $readFieldBlacklistKeys = "''";
        }

        $db = Bootstrap::get('olddb');
        $return = array();
        $column_name = isset($params['column_name']) ? $params['column_name'] : -1;
        $hasMaster = false;
        $sql =
        '(SELECT
            DISTINCT C.column_name as id,
            C.column_name AS column_name,
            UCASE(C.data_type) as type,
            CHARACTER_MAXIMUM_LENGTH as char_length,
            IS_NULLABLE as is_nullable,
            COLUMN_DEFAULT as default_value,
            ifnull(comment, COLUMN_COMMENT) as comment,
            ifnull(sort, ORDINAL_POSITION) as sort,
            ui,
            ifnull(system,0) as system,
            ifnull(master,0) as master,
            ifnull(hidden_list,0) as hidden_list,
            ifnull(hidden_input,0) as hidden_input,
            relationship_type,
            table_related,
            junction_table,
            junction_key_left,
            junction_key_right,
            ifnull(D.required,0) as required,
            COLUMN_TYPE as column_type
        FROM
            INFORMATION_SCHEMA.COLUMNS C
        LEFT JOIN
            directus_columns AS D ON (C.COLUMN_NAME = D.column_name AND C.TABLE_NAME = D.table_name)
        WHERE
            C.TABLE_SCHEMA = :schema
        AND
            C.table_name = :table_name
        AND
            (:column_name = -1 OR C.column_name = :column_name)
        AND
            (C.column_name NOT IN ('.$readFieldBlacklistKeys.'))
        )
        UNION (SELECT
            DC.`column_name` AS id,
            DC.column_name AS column_name,
            UCASE(data_type) as type,
            NULL AS char_length,
            "NO" as is_nullable,
            NULL AS default_value,
            comment,
            sort,
            ui,
            system,
            master,
            hidden_list,
            hidden_input,
            relationship_type,
            table_related,
            junction_table,
            junction_key_left,
            junction_key_right,
            DC.required,
            NULL as column_type
        FROM
            `directus_columns` DC
        WHERE
            DC.`table_name` = :table_name AND (data_type="alias" OR data_type="MANYTOMANY" OR data_type = "ONETOMANY")
        AND
            (:column_name = -1 OR DC.column_name = :column_name)
        AND
            (DC.column_name NOT IN ('.$readFieldBlacklistKeys.'))
        AND
            data_type IS NOT NULL) ORDER BY sort';

        $sth = $db->dbh->prepare($sql);
        $sth->bindValue(':table_name', $tbl_name, \PDO::PARAM_STR);
        $sth->bindValue(':schema', $db->db_name, \PDO::PARAM_STR);
        $sth->bindValue(':column_name', $column_name, \PDO::PARAM_INT);

        foreach($readFieldBlacklistParams as $key => $value) {
            $sth->bindValue($key, $value, \PDO::PARAM_STR);
        }

        $sth->execute();

        $writeFieldBlacklist = $acl->getTablePrivilegeList($tbl_name, $acl::FIELD_WRITE_BLACKLIST);

        while ($row = $sth->fetch(\PDO::FETCH_ASSOC)) {

            foreach ($row as $key => $value) {
                if (is_null($value)) {
                    unset ($row[$key]);
                }
            }

            // Read method formatColumnRow
            // @TODO: combine this method with AllSchema, kind of doing same thing
            if (array_key_exists('type', $row) && $row['type'] == 'MANYTOMANY') {
                $row['is_nullable'] = "YES";
            }

            if ($row['is_nullable'] == "NO") {
                $row["required"] = true;
            }

            // Basic type casting. Should eventually be done with the schema
            $row["required"] = (bool) $row['required'];
            $row["system"] = (bool) $row["system"];
            $row["master"] = (bool) $row["master"];
            $row["hidden_list"] = (bool) $row["hidden_list"];
            $row["hidden_input"] = (bool) $row["hidden_input"];
            $row["is_writable"] = !in_array($row['id'], $writeFieldBlacklist);

            if (array_key_exists('sort', $row)) {
                $row["sort"] = (int)$row['sort'];
            }

            $hasMaster = $row["master"];

            // Default UI types.
            if (!isset($row["ui"])) {
                $row['ui'] = $db->column_type_to_ui_type($row['type']);
            }

            // Defualts as system columns
            if ($row["id"] == 'id' || $row["id"] == STATUS_COLUMN_NAME || $row["id"] == 'sort') {
                $row["system"] = true;
                $row["hidden"] = true;
            }

            if (array_key_exists('ui', $row)) {
                $options = $db->get_ui_options( $tbl_name, $row['id'], $row['ui'] );
            }

            if (isset($options)) {
                $row["options"] = $options;
            }

            if (array_key_exists('table_related', $row)) {
                $row['relationship'] = array();
                $row['relationship']['type'] = $row['relationship_type'];
                $row['relationship']['table_related'] = $row['table_related'];

                unset($row['relationship_type']);
                unset($row['table_related']);

                if (array_key_exists('junction_key_left', $row)) {
                    $row['relationship']['junction_key_left'] = $row['junction_key_left'];
                    unset($row['junction_key_left']);
                }

                if (array_key_exists('junction_key_right', $row)) {
                    $row['relationship']['junction_key_right'] = $row['junction_key_right'];
                    unset($row['junction_key_right']);
                }

                if (array_key_exists('junction_table', $row)) {
                    $row['relationship']['junction_table'] = $row['junction_table'];
                    unset($row['junction_table']);
                }

            }

            array_push($return, array_change_key_case($row, CASE_LOWER));
        }

        // Default column 3 as master. Should be refined!
        //if (!$hasMaster) {
        //    $return[3]['master'] = true;
        //}
        if ($column_name != -1) {
            if(count($return) > 0) {
                return $return[0];
            } else {
                throw new \Exception("No Schema Found for table ".$tbl_name." with params: ".json_encode($params));
            }
        }
        return $return;
    }

    //
    //---------------------------------------------------------------------------


    public static function getAllSchemas($userGroupId, $versionHash) {
        $cacheKey = MemcacheProvider::getKeyDirectusGroupSchema($userGroupId, $versionHash);
        $acl = Bootstrap::get('acl');
        $ZendDb = Bootstrap::get('ZendDb');
        $directusPreferencesTableGateway = new DirectusPreferencesTableGateway($acl, $ZendDb);

        $getPreferencesFn = function() use ($directusPreferencesTableGateway) {
            $currentUser = Auth::getUserInfo();
            $preferences = $directusPreferencesTableGateway->fetchAllByUser($currentUser['id']);
            return $preferences;
        };

        $getSchemasFn = function () {
            $tableSchemas = TableSchema::getTableSchemas();
            $columnSchemas = TableSchema::getColumnSchemas();
            // Nest column schemas in table schemas
            foreach ($tableSchemas as &$table) {
                $tableName = $table['id'];
                $table['columns'] = array_values($columnSchemas[$tableName]);
                $table = array(
                    'schema' => $table,
                );
            }

            return $tableSchemas;
        };

        // 3 hr cache
        $schemas = $directusPreferencesTableGateway->memcache->getOrCache($cacheKey, $getSchemasFn, 10800);

        // Append preferences post cache
        $preferences = $getPreferencesFn();
        foreach ($schemas as &$table) {
            $table['preferences'] = $preferences[$table['schema']['id']];
        }

        return $schemas;
    }

    public static function getTableSchemas() {
        $db = Bootstrap::get('olddb');
        $config = Bootstrap::get('config');
        $blacklist = '""';
        if (array_key_exists('tableBlacklist', $config)) {
            $blacklist = $config['tableBlacklist'];
            $blacklist = '"'.implode($blacklist, '","').'"';
        }

        $sql =
            'SELECT
                ST.TABLE_NAME as id,
                ST.TABLE_NAME as table_name,
                CREATE_TIME AS date_created,
                TABLE_COMMENT AS comment,
                ifnull(hidden,0) as hidden,
                ifnull(single,0) as single,
                default_status,
                is_junction_table,
                user_create_column,
                user_update_column,
                date_create_column,
                date_update_column,
                footer,
                list_view,
                column_groupings,
                filter_column_blacklist,
                primary_column,
                TABLE_ROWS AS count
            FROM
                INFORMATION_SCHEMA.TABLES ST
            LEFT JOIN
                directus_tables DT ON (DT.table_name = ST.TABLE_NAME)
            WHERE
                ST.TABLE_SCHEMA = :schema
                AND ST.TABLE_TYPE = "BASE TABLE"
                AND
                (
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
                    )
                    AND
                    ST.TABLE_NAME NOT IN ('.$blacklist.')
                )
            GROUP BY ST.TABLE_NAME
            ORDER BY ST.TABLE_NAME';

        $sth = $db->dbh->prepare($sql);
        $sth->bindValue(':schema', $db->db_name, \PDO::PARAM_STR);
        $sth->execute();
        $tables = array();

        while ($row = $sth->fetch(\PDO::FETCH_ASSOC)) {
            // Only include tables w ACL privileges
            if(self::canGroupViewTable($row['table_name'])) {
                $tables[] = self::formatTableRow($row);
            }
        }

        return $tables;
    }

    public static function getColumnSchemas() {
        $db = Bootstrap::get('olddb');
        $acl = Bootstrap::get('acl');
        $ZendDb = Bootstrap::get('ZendDb');

        $sql =
            '(
                SELECT
                    C.table_name,
                    C.column_name AS column_name,
                    ifnull(sort, ORDINAL_POSITION) as sort,
                    UCASE(C.data_type) as type,
                    CHARACTER_MAXIMUM_LENGTH as char_length,
                    IS_NULLABLE as is_nullable,
                    COLUMN_DEFAULT as default_value,
                    ifnull(comment, COLUMN_COMMENT) as comment,
                    ui,
                    ifnull(system,0) as system,
                    ifnull(master,0) as master,
                    ifnull(hidden_list,0) as hidden_list,
                    ifnull(hidden_input,0) as hidden_input,
                    relationship_type,
                    table_related,
                    junction_table,
                    junction_key_left,
                    junction_key_right,
                    ifnull(D.required,0) as required,
                    COLUMN_TYPE as column_type
                FROM
                    INFORMATION_SCHEMA.COLUMNS C
                LEFT JOIN
                    INFORMATION_SCHEMA.TABLES T ON C.TABLE_NAME = T.TABLE_NAME
                LEFT JOIN
                    directus_columns AS D ON (C.COLUMN_NAME = D.column_name AND C.TABLE_NAME = D.table_name)
                WHERE
                    C.TABLE_SCHEMA = :schema AND (T.TABLE_SCHEMA = :schema AND T.TABLE_TYPE = "BASE TABLE")

            ) UNION ALL (

                SELECT
                    `table_name`,
                    `column_name` AS column_name,
                    sort,
                    UCASE(data_type) as type,
                    NULL AS char_length,
                    "NO" as is_nullable,
                    NULL AS default_value,
                    comment,
                    ui,
                    system,
                    master,
                    hidden_list,
                    hidden_input,
                    relationship_type,
                    table_related,
                    junction_table,
                    junction_key_left,
                    junction_key_right,
                    DC.required,
                    NULL as column_type
                FROM
                    `directus_columns` DC
                WHERE
                    `data_type` IN ("alias", "MANYTOMANY", "ONETOMANY")

            ) ORDER BY `table_name`';

        $sth = $db->dbh->prepare($sql);
        $sth->bindValue(':schema', $db->db_name, \PDO::PARAM_STR);
        $sth->execute();

        // Group columns by table name
        $tables = array();
        $tableName = null;

        while ($row = $sth->fetch(\PDO::FETCH_ASSOC)) {
            $tableName = $row['table_name'];
            $columnName = $row['column_name'];

            // Create nested array by table name
            if (!array_key_exists($tableName, $tables)) {
                $tables[$tableName] = array();
            }

            // @todo getTablePrivilegeList is called in excess,
            // should just be called when $tableName changes
            $readFieldBlacklist = $acl->getTablePrivilegeList($tableName, $acl::FIELD_READ_BLACKLIST);
            $writeFieldBlacklist = $acl->getTablePrivilegeList($tableName, $acl::FIELD_WRITE_BLACKLIST);

            // Indicate if the column is blacklisted for writing
            $row["is_writable"] = !in_array($columnName, $writeFieldBlacklist);

            // Don't include a column that is blacklisted for reading
            if (in_array($columnName, $readFieldBlacklist)) {
                continue;
            }

            $row = self::formatColumnRow($row);
            $tables[$tableName][$columnName] = $row;
        }

        // UI's
        $directusUiTableGateway = new DirectusUiTableGateway($acl, $ZendDb);
        $uis = $directusUiTableGateway->fetchExisting()->toArray();

        foreach ($uis as $ui) {
            $uiTableName = $ui['table_name'];
            $uiColumnName = $ui['column_name'];

            // Does the table for the UI settings still exist?
            if (array_key_exists($uiTableName, $tables)) {
                // Does the column for the UI settings still exist?
                if (array_key_exists($uiColumnName, $tables[$uiTableName])) {
                    $column = &$tables[$uiTableName][$uiColumnName];
                    $column['options']['id'] = $ui['ui_name'];
                    $column['options'][$ui['name']] = $ui['value'];
                }
            }

        }

        return $tables;
    }

    private static function formatTableRow($info) {
        $info['hidden'] = (boolean) $info['hidden'];
        $info['single'] = (boolean) $info['single'];
        $info['footer'] = (boolean) $info['footer'];
        $info['is_junction_table'] = (boolean) $info['is_junction_table'];
        return $info;
    }

    private static function formatColumnRow($row) {
        $db = Bootstrap::get('olddb');
        $columnName = $row['column_name'];

        foreach ($row as $key => $value) {
            if (is_null($value)) {
                unset ($row[$key]);
            }
        }

        unset($row['table_name']);

        $row['id'] = $columnName;
        $row['options'] = array();

        // Many-to-Many type it actually can be null,
        // it's based on a junction table, not a real column.
        // Issue #612 https://github.com/RNGR/directus6/issues/612
        if (array_key_exists('type', $row) && $row['type'] == 'MANYTOMANY') {
            $row['is_nullable'] = "YES";
        }

        if ($row['is_nullable'] == "NO") {
            $row["required"] = true;
        }

        // Basic type casting. Should eventually be done with the schema
        $row["required"] = (bool) $row['required'];
        $row["system"] = (bool) $row["system"];
        $row["master"] = (bool) $row["master"];
        $row["hidden_list"] = (bool) $row["hidden_list"];
        $row["hidden_input"] = (bool) $row["hidden_input"];


        //$row["is_writable"] = !in_array($row['id'], $writeFieldBlacklist);

        if (array_key_exists('sort', $row)) {
            $row["sort"] = (int)$row['sort'];
        }

        $hasMaster = $row["master"];

        // Default UI types.
        if (!isset($row["ui"])) {
            $row['ui'] = $db->column_type_to_ui_type($row['type']);
        }

        // Defualts as system columns
        if ($row["id"] == 'id' || $row["id"] == STATUS_COLUMN_NAME || $row["id"] == 'sort') {
            $row["system"] = true;
            $row["hidden"] = true;
        }

        if (array_key_exists('table_related', $row)) {
            $row['relationship'] = array();
            $row['relationship']['type'] = $row['relationship_type'];
            $row['relationship']['table_related'] = $row['table_related'];

            unset($row['relationship_type']);
            unset($row['table_related']);

            if (array_key_exists('junction_key_left', $row)) {
                $row['relationship']['junction_key_left'] = $row['junction_key_left'];
                unset($row['junction_key_left']);
            }

            if (array_key_exists('junction_key_right', $row)) {
                $row['relationship']['junction_key_right'] = $row['junction_key_right'];
                unset($row['junction_key_right']);
            }

            if (array_key_exists('junction_table', $row)) {
                $row['relationship']['junction_table'] = $row['junction_table'];
                unset($row['junction_table']);
            }

        }

        return $row;
    }

}