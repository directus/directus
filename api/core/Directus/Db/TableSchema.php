<?php

namespace Directus\Db;

use Directus\Auth\Provider as Auth;
use Directus\Bootstrap;
use Directus\Db\TableGateway\DirectusPreferencesTableGateway;
use Directus\Db\TableGateway\RelationalTableGateway;

class TableSchema {

    public static $many_to_one_uis = array('many_to_one', 'single_media');

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
        'region'            => 'regions',
        'region_id'         => 'regions',
        'room_id'           => 'rooms',
        'instructor_id'     => 'instructors',
        'class_type_id'     => 'classes',

        // potentially ambiguous; there's also the product_categories table
        // however this
        'category'          => 'community_categories',

        // potentially ambiguous; but as of yet this should point to riders and not
        // to directus_users, since the only tables implementing this many-to-one
        // column name are: waitlist, and community_comments, which seem to have
        // nothing to do with directus_users
        'user_id'           => 'riders',

        'studio_id'         => 'studios',
        'bike_id'           => 'bikes',
        'complaint'         => 'bike_complaints',
        'studio_id'         => 'studios',
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

    public static function getTableColumns($table, $limit = null) {

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
                S.column_name NOT IN (:field_read_blacklist)';

        $db = Bootstrap::get('olddb');
        $sth = $db->dbh->prepare($sql);
        $sth->bindValue(':table_name', $table, \PDO::PARAM_STR);
        $sth->bindValue(':field_read_blacklist', $readFieldBlacklist, \PDO::PARAM_STR);
        $sth->execute();

        $columns = array();
        $ignoreColumns = array('id','active','sort');
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
     *
     * @param $params
     */
    public static function getTables($params=null) {
        $return = array();
        $db = Bootstrap::get('olddb');
        $name = $db->db_name;
        $sql = 'SELECT S.TABLE_NAME as id
            FROM INFORMATION_SCHEMA.TABLES S
            WHERE
                S.TABLE_SCHEMA = :schema AND
                (S.TABLE_NAME NOT LIKE "directus\_%" OR
                S.TABLE_NAME = "directus_activity" OR
                S.TABLE_NAME = "directus_media" OR
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

        $acl = Bootstrap::get('acl');
        $ZendDb = Bootstrap::get('ZendDb');
        $Preferences = new DirectusPreferencesTableGateway($acl, $ZendDb);

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
    }

    public static function canGroupViewTable($tableName) {
        $acl = Bootstrap::get('acl');
        $tablePrivilegeList = $acl->getTablePrivilegeList($tableName, $acl::TABLE_PERMISSIONS);
        if(in_array('view', $tablePrivilegeList)) {
            return true;
        }
        return false;
    }

    protected static function getTable($tbl_name) {
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
            inactive_by_default,
            is_junction_table,
            magic_owner_column,
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
            $info['inactive_by_default'] = (boolean) $info['inactive_by_default'];
        }
        $relationalTableGateway = new RelationalTableGateway($acl, $tbl_name, $ZendDb);
        $info = array_merge($info, $relationalTableGateway->countActiveOld());

        $info['columns'] = self::getSchemaArray($tbl_name);
        return $info;
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
        $readFieldBlacklist = implode(', ', $readFieldBlacklist);

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
            ifnull(D.required,0) as required
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
            (C.column_name NOT IN (:field_read_blacklist))
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
            DC.required
        FROM
            `directus_columns` DC
        WHERE
            DC.`table_name` = :table_name AND (data_type="alias" OR data_type="MANYTOMANY" OR data_type = "ONETOMANY")
        AND
            (:column_name = -1 OR DC.column_name = :column_name)
        AND
            (DC.column_name NOT IN (:field_read_blacklist))
        AND
            data_type IS NOT NULL) ORDER BY sort';
        $sth = $db->dbh->prepare($sql);
        $sth->bindValue(':table_name', $tbl_name, \PDO::PARAM_STR);
        $sth->bindValue(':schema', $db->db_name, \PDO::PARAM_STR);
        $sth->bindValue(':column_name', $column_name, \PDO::PARAM_INT);
        $sth->bindValue(':field_read_blacklist', $readFieldBlacklist, \PDO::PARAM_STR);
        $sth->execute();

        $writeFieldBlacklist = $acl->getTablePrivilegeList($tbl_name, $acl::FIELD_WRITE_BLACKLIST);

        while ($row = $sth->fetch(\PDO::FETCH_ASSOC)) {

            foreach ($row as $key => $value) {
                if (is_null($value)) {
                    unset ($row[$key]);
                }
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
            if ($row["id"] == 'id' || $row["id"] == 'active' || $row["id"] == 'sort') {
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
            return $return[0];
        }
        return $return;
    }

}