<?php

namespace Directus\Db;

use Directus\Bootstrap;

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
            if (isset($column['master']) && true == $column['master'])
                return $column;
        }
        return false;
    }

    public static function getFirstNonSystemColumn($schema) {
        foreach ($schema as $column) {
            if(isset($column['system']) && false != $column['system'])
                continue;
            return $column;
        }
        return false;
    }

    public static function columnIsCollectionAssociation($column) {
        return in_array($column['type'], self::$association_types);
    }

    public static function getAllNonAliasTableColumns($table) {
        $columnNames = array();
        $schemaArray = self::loadSchema($table);
        foreach($schemaArray as $column) {
            if(self::columnIsCollectionAssociation($column))
                continue;
            $columnNames[] = $column['id'];
        }
        return $columnNames;
    }

    public static function getTableColumns($table, $limit = null) {

        // Omit columns which are on this table's read field blacklist for the group of
        // the currently authenticated user.
        $acl = Bootstrap::get('aclProvider');
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
            if(!in_array($row['column_name'], $ignoreColumns))
                array_push($columns, $row['column_name']);
            if($i === $limit)
                break;
        }
        return $columns;
    }

    public static function getUniqueColumnName($tbl_name) {
        // @todo for safe joins w/o name collision
    }

    /**
     * Get table structure
     * @param $tbl_name
     * @param $params
     */
    protected static function loadSchema($tbl_name, $params = null) {

        // Omit columns which are on this table's read field blacklist for the group of
        // the currently authenticated user.
        $acl = Bootstrap::get('aclProvider');
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

            array_push($return, array_change_key_case($row,CASE_LOWER));

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