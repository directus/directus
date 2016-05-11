<?php

namespace Directus\Db;

use Directus\Auth\Provider as Auth;
use Directus\Bootstrap;
use Directus\Db\TableGateway\DirectusPreferencesTableGateway;
use Directus\Db\TableGateway\RelationalTableGateway;
use Directus\Db\TableGateway\DirectusUiTableGateway;
use Directus\MemcacheProvider;
use Zend\Db\Adapter\ParameterContainer;
use Directus\Util\ArrayUtils;
use Zend\Db\Sql\Expression;
use Zend\Db\Sql\Predicate\In;
use Zend\Db\Sql\Predicate\IsNotNull;
use Zend\Db\Sql\Predicate\NotIn;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\TableIdentifier;
use Zend\Db\Sql\Where;

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
    protected static $_primaryKeys = array();

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

    public static function getAllAliasTableColumns($table, $onlyNames = false) {
        $columns = array();
        $schemaArray = self::loadSchema($table);
        foreach($schemaArray as $column) {
            if(!self::columnIsCollectionAssociation($column)) {
                continue;
            }
            if ($onlyNames) {
                $column = $column['column_name'];
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

        $select = new Select();
        $select->columns([
            'column_name'
        ]);

        $select->from(['S' => new TableIdentifier('COLUMNS', 'INFORMATION_SCHEMA')]);
        $select->join(
            ['D' => 'directus_columns'],
            'D.column_name = S.column_name AND D.table_name = S.table_name',
            ['system', 'master'],
            $select::JOIN_LEFT
        );
        $conditions = [
            'S.table_name' => $table,
            'S.table_schema' => DB_NAME
        ];

        if ($readFieldBlacklist) {
            $conditions[] = new NotIn('S.column_name', $readFieldBlacklist);
        }

        $select->where($conditions);

        $zendDb = Bootstrap::get('ZendDb');

        $sql = new Sql($zendDb);
        $statement = $sql->prepareStatementForSqlObject($select);
        $result = $statement->execute();

        $columns = array();
        $primaryKeyFieldName = self::getTablePrimaryKey($table);
        if (!$primaryKeyFieldName) {
            $primaryKeyFieldName = 'id';
        }
        $ignoreColumns = ($skipIgnore !== true) ? array($primaryKeyFieldName,STATUS_COLUMN_NAME,'sort') : array();
        $i = 0;
        foreach($result as $row) {
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

    public static function hasTableColumn($table, $column, $includeAlias = false) {
      $columns = array_flip(self::getTableColumns($table, null, true));
      if ($includeAlias) {
          $columns = array_merge($columns, array_flip(self::getAllAliasTableColumns($table, true)));
      }

      if (array_key_exists($column, $columns)) {
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
        $zendDb = Bootstrap::get('zendDb');
        $select = new Select();

        $select->columns([
            'table_name' => 'TABLE_NAME'
        ]);
        $select->from(new TableIdentifier('TABLES', 'INFORMATION_SCHEMA'));
        $select->where([
            'TABLE_SCHEMA' => $zendDb->getCurrentSchema(),
            'TABLE_TYPE' => 'BASE TABLE'
        ]);

        $sql = new Sql($zendDb);
        $statement = $sql->prepareStatementForSqlObject($select);
        $result = $statement->execute();

        $tables = array();
        foreach($result as $row) {
            $tableName = $row['table_name'];
            if(self::canGroupViewTable($tableName)) {
                $tables[] = $tableName;
            }
        }

        return $tables;
    }

    /**
     * Get info about all tables
     */
    public static function getTables($userGroupId, $versionHash) {
        $acl = Bootstrap::get('acl');
        $zendDb = Bootstrap::get('ZendDb');
        $Preferences = new DirectusPreferencesTableGateway($acl, $zendDb);
        $getTablesFn = function () use ($Preferences, $zendDb) {
            $return = array();
            $schemaName = $zendDb->getCurrentSchema();

            $select = new Select();
            $select->columns([
                'id' => 'TABLE_NAME'
            ]);
            $select->from(['S' => new TableIdentifier('TABLES', 'INFORMATION_SCHEMA')]);
            $select->where([
                'TABLE_SCHEMA' => $schemaName,
                new NotIn('TABLE_NAME', Schema::getDirectusTables())
            ]);

            $sql = new Sql($zendDb);
            $statement = $sql->prepareStatementForSqlObject($select);
            $result = $statement->execute();

            $currentUser = Auth::getUserInfo();

            foreach($result as $row) {
                if(!self::canGroupViewTable($row['id'])) {
                    continue;
                }
                $tbl["schema"] = self::getTable($row['id']);
                //$tbl["columns"] = $this->get_table($row['id']);
                $tbl["preferences"] = $Preferences->fetchByUserAndTableAndTitle($currentUser['id'], $row['id']);
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
        if (array_key_exists('allow_view', $tablePrivilegeList) && $tablePrivilegeList['allow_view'] > 0) {
            return true;
        }
        return false;
    }

    public static function getTable($tbl_name) {
        $acl = Bootstrap::get('acl');
        $zendDb = Bootstrap::get('ZendDb');

        if(!self::canGroupViewTable($tbl_name)) {
            return false;
        }

        $select = new Select();
        $select->columns([
            'id' => 'TABLE_NAME',
            'table_name' => 'TABLE_NAME',
            'date_created' => 'CREATE_TIME',
            'comment' => 'TABLE_COMMENT',
            'count' => 'TABLE_ROWS'
        ]);

        $select->from(['T' => new TableIdentifier('TABLES', 'INFORMATION_SCHEMA')]);
        $select->join(
            ['DT' => 'directus_tables'],
            'DT.table_name = T.TABLE_NAME',
            [
                'hidden' => new Expression('IFNULL(hidden, 0)'),
                'single' => new Expression('IFNULL(single, 0)'),
                'is_junction_table',
                'user_create_column',
                'user_update_column',
                'date_create_column',
                'date_update_column',
                'footer',
            ],
            $select::JOIN_LEFT
        );

        $select->where([
            'T.TABLE_NAME' => $tbl_name,
            'T.TABLE_SCHEMA' => $zendDb->getCurrentSchema()
        ]);

        $sql = new Sql($zendDb);
        $statement = $sql->prepareStatementForSqlObject($select);
        $result = $statement->execute();

        $info = $result->current();

        if (!$info) {
            return false;
        }

        if ($info) {
            $info['hidden'] = (boolean) $info['hidden'];
            $info['single'] = (boolean) $info['single'];
            $info['footer'] = (boolean) $info['footer'];
            $info['is_junction_table'] = (boolean) $info['is_junction_table'];
        }
        $relationalTableGateway = new RelationalTableGateway($acl, $tbl_name, $zendDb);
        $info = array_merge($info, $relationalTableGateway->countActiveOld());

        $info['columns'] = self::getSchemaArray($tbl_name);
        $directusPreferencesTableGateway = new DirectusPreferencesTableGateway($acl, $zendDb);
        $currentUser = Auth::getUserInfo();
        $info['preferences'] = $directusPreferencesTableGateway->fetchByUserAndTable($currentUser['id'], $tbl_name);
        return $info;
    }

    /**
     * Get table primary key
     * @param $tableName
     * @return String|boolean - column name or false
     */
    public static function getTablePrimaryKey($tableName)
    {
        if (isset(self::$_primaryKeys[$tableName])) {
            return self::$_primaryKeys[$tableName];
        }

        $zendDb = Bootstrap::get('zendDb');
        $select = new Select();
        $columnName = null;

        // @todo: make this part of loadSchema
        // without the need to use acl and create a infinite nested function call
        $select->columns([
             'column_name' => 'COLUMN_NAME'
        ]);
        $select->from(new TableIdentifier('COLUMNS', 'INFORMATION_SCHEMA'));
        $select->where([
            'TABLE_NAME' => $tableName,
            'TABLE_SCHEMA' => $zendDb->getCurrentSchema(),
            'COLUMN_KEY' => 'PRI'
        ]);

        $sql = new Sql($zendDb);
        $statement = $sql->prepareStatementForSqlObject($select);
        $result = $statement->execute();

        $column = $result->current();
        if ($column) {
            $columnName = $column['column_name'];
        }

        return self::$_primaryKeys[$tableName] = $columnName;
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

        $zendDb = Bootstrap::get('ZendDb');
        $return = array();
        $column_name = isset($params['column_name']) ? $params['column_name'] : -1;
        $hasMaster = false;

        $selectOne = new Select();
        $selectOne->quantifier($selectOne::QUANTIFIER_DISTINCT);
        $selectOne->columns([
            'id' => 'COLUMN_NAME',
            'column_name' => 'COLUMN_NAME',
            'type' => new Expression('UCASE(C.DATA_TYPE)'),
            'char_length' => 'CHARACTER_MAXIMUM_LENGTH',
            'is_nullable' => 'IS_NULLABLE',
            'default_value' => 'COLUMN_DEFAULT',
            'comment' => new Expression('IFNULL(comment, COLUMN_COMMENT)'),
            'sort' => new Expression('IFNULL(sort, ORDINAL_POSITION)'),
            'column_type' => 'COLUMN_TYPE'
        ]);
        $selectOne->from(['C' => new TableIdentifier('COLUMNS', 'INFORMATION_SCHEMA')]);
        $selectOne->join(
            ['D' => 'directus_columns'],
            'C.COLUMN_NAME = D.column_name AND C.TABLE_NAME = D.table_name',
            [
                'ui',
                'system' => new Expression('IFNULL(system, 0)'),
                'master' => new Expression('IFNULL(master, 0)'),
                'hidden_list' => new Expression('IFNULL(hidden_list, 0)'),
                'hidden_input' => new Expression('IFNULL(hidden_input, 0)'),
                'relationship_type',
                'table_related',
                'junction_table',
                'junction_key_left',
                'junction_key_right',
                'required' => new Expression('IFNULL(D.required, 0)'),
            ],
            $selectOne::JOIN_LEFT
        );

        $where = new Where();
        $where
            ->equalTo('C.TABLE_SCHEMA', $zendDb->getCurrentSchema())
            ->equalTo('C.TABLE_NAME', $tbl_name)
            ->nest()
                ->addPredicate(new \Zend\Db\Sql\Predicate\Expression("'$column_name' = '-1'"))
                ->OR
                ->equalTo('C.column_name', $column_name)
            ->unnest();

        // @TODO: too many read field black list.
        // which one are the correct ones or what are the purpose of the others?
        $blacklist = array_keys($readFieldBlacklistParams);
        if (count($blacklist)) {
            $where->addPredicate(new NotIn('C.COLUMN_NAME', $blacklist));
        }
        $selectOne->where($where);

        $selectTwo = new Select();
        $selectTwo->columns([
            'id' => 'column_name',
            'column_name',
            'type' => new Expression('UCASE(data_type)'),
            'char_length' => new Expression('NULL'),
            'is_nullable' => new Expression("'NO'"),
            'default_value' => new Expression('NULL'),
            'comment',
            'sort',
            'column_type' => new Expression('NULL'),
            'ui',
            'system',
            'master',
            'hidden_list',
            'hidden_input',
            'relationship_type',
            'table_related',
            'junction_table',
            'junction_key_left',
            'junction_key_right',
            'required' => new Expression('IFNULL(required, 0)')
        ]);
        $selectTwo->from('directus_columns');
        $where = new Where();
        $where
            ->equalTo('TABLE_NAME', $tbl_name)
            ->addPredicate(new In('data_type', ['alias', 'MANYTOMANY', 'ONETOMANY']))
            ->nest()
            ->addPredicate(new \Zend\Db\Sql\Predicate\Expression("'$column_name' = '-1'"))
            ->OR
            ->equalTo('column_name', $column_name)
            ->unnest()
            ->addPredicate(new IsNotNull('data_type'));

        if (count($blacklist)) {
            $where->addPredicate(new NotIn('C.COLUMN_NAME', $blacklist));
        }

        $selectTwo->where($where);
        $selectTwo->order('sort');

        $selectOne->combine($selectTwo);

        $sql = new Sql($zendDb);
        $statement = $sql->prepareStatementForSqlObject($selectOne);
        $result = $statement->execute();

        $writeFieldBlacklist = $acl->getTablePrivilegeList($tbl_name, $acl::FIELD_WRITE_BLACKLIST);

        foreach ($result as $row) {
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
                $row['ui'] = self::columnTypeToUIType($row['type']);
            }

            // Defualts as system columns
            if ($row["id"] == 'id' || $row["id"] == STATUS_COLUMN_NAME || $row["id"] == 'sort') {
                $row["system"] = true;
                $row["hidden"] = true;
            }

            if (array_key_exists('ui', $row)) {
                $options = self::getUIOptions( $tbl_name, $row['id'], $row['ui'] );
            }

            if (isset($options)) {
                $row["options"] = $options;
            }

            if (array_key_exists('table_related', $row)) {
                $row['relationship'] = array();
                $row['relationship']['type'] = ArrayUtils::get($row, 'relationship_type');
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
                foreach($columnSchemas[$tableName] as $column) {
                    if ($column['column_key'] == 'PRI') {
                        $table['primary_column'] = $column['column_name'];
                        break;
                    }
                }
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
        $zendDb = Bootstrap::get('zendDb');
        $config = Bootstrap::get('config');
        $blacklist = '""';
        if (array_key_exists('tableBlacklist', $config)) {
            $blacklist = $config['tableBlacklist'];
            // $blacklist = '"'.implode($blacklist, '","').'"';
        }

        $select = new Select();
        $select->columns([
            'id' => 'TABLE_NAME',
            'table_name' => 'TABLE_NAME',
            'date_created' => 'CREATE_TIME',
            'comment' => 'TABLE_COMMENT',
            'count' => 'TABLE_ROWS'
        ]);
        $select->from(['ST' => new TableIdentifier('TABLES', 'INFORMATION_SCHEMA')]);
        $select->join(
            ['DT' => 'directus_tables'],
            'DT.table_name = ST.TABLE_NAME',
            [
                'hidden' => new Expression('IFNULL(hidden, 0)'),
                'single' => new Expression('IFNULL(single, 0)'),
                'is_junction_table',
                'user_create_column',
                'user_update_column',
                'date_create_column',
                'date_update_column',
                'footer',
                'list_view',
                'column_groupings',
                'filter_column_blacklist',
                'primary_column'
            ],
            $select::JOIN_LEFT
        );

        $select->where([
            'ST.TABLE_SCHEMA' => $zendDb->getCurrentSchema(),
            'ST.TABLE_TYPE' => 'BASE TABLE',
            new NotIn('ST.TABLE_NAME', array_merge(Schema::getDirectusTables(), (array)$blacklist)),
        ]);

        $sql = new Sql($zendDb);
        $statement = $sql->prepareStatementForSqlObject($select);
        $result = $statement->execute();

        $tables = array();

        foreach($result as $row) {
            // Only include tables w ACL privileges
            if(self::canGroupViewTable($row['table_name'])) {
                $tables[] = self::formatTableRow($row);
            }
        }

        return $tables;
    }

    public static function getColumnSchemas() {
        $acl = Bootstrap::get('acl');
        $zendDb = Bootstrap::get('ZendDb');

        $selectOne = new Select();
        $selectOne->columns([
            'column_name' => 'COLUMN_NAME',
            'sort' => new Expression('IFNULL(sort, ORDINAL_POSITION)'),
            'type' => new Expression('UCASE(C.DATA_TYPE)'),
            'char_length' => 'CHARACTER_MAXIMUM_LENGTH',
            'is_nullable' => 'IS_NULLABLE',
            'default_value' => 'COLUMN_DEFAULT',
            'comment' => new Expression('IFNULL(comment, COLUMN_COMMENT)'),
            'column_type' => 'COLUMN_TYPE',
            'column_key' => 'COLUMN_KEY'
        ]);

        $selectOne->from(['C' => new TableIdentifier('COLUMNS', 'INFORMATION_SCHEMA')]);
        $selectOne->join(
            ['D' => 'directus_columns'],
            'C.COLUMN_NAME = D.column_name AND C.TABLE_NAME = D.table_name',
            [
                'ui',
                'system' => new Expression('IFNULL(system, 0)'),
                'master' => new Expression('IFNULL(master, 0)'),
                'hidden_list' => new Expression('IFNULL(hidden_list, 0)'),
                'hidden_input' => new Expression('IFNULL(hidden_input, 0)'),
                'relationship_type',
                'table_related',
                'junction_table',
                'junction_key_left',
                'junction_key_right',
                'required' => new Expression('IFNULL(D.required, 0)'),
            ],
            $selectOne::JOIN_LEFT
        );

        $selectOne->join(
            ['T' => new TableIdentifier('TABLES', 'INFORMATION_SCHEMA')],
            'C.TABLE_NAME = T.TABLE_NAME',
            ['table_name' => 'TABLE_NAME'],
            $selectOne::JOIN_LEFT
        );

        $selectOne->where([
            'C.TABLE_SCHEMA' => $zendDb->getCurrentSchema(),
            'T.TABLE_TYPE' => 'BASE TABLE'
        ]);

        $selectTwo = new Select();
        $selectTwo->columns([
            'column_name',
            'sort',
            'type' => new Expression('UCASE(data_type)'),
            'char_length' => new Expression('NULL'),
            'is_nullable' => new Expression("'NO'"),
            'default_value' => new Expression('NULL'),
            'comment',
            'column_type' => new Expression('NULL'),
            'column_key' => new Expression('NULL'),
            'ui',
            'system',
            'master',
            'hidden_list',
            'hidden_input',
            'relationship_type',
            'table_related',
            'junction_table',
            'junction_key_left',
            'junction_key_right',
            'required' => new Expression('IFNULL(required, 0)'),
            'table_name'
        ]);
        $selectTwo->from('directus_columns');
        $where = new Where();
        $where
            ->addPredicate(new In('data_type', ['alias', 'MANYTOMANY', 'ONETOMANY']));

        $selectOne->combine($selectTwo);
        $selectOne->order('table_name');

        $sql = new Sql($zendDb);
        $statement = $sql->prepareStatementForSqlObject($selectOne);
        $result = $statement->execute();

        // Group columns by table name
        $tables = array();
        $tableName = null;

        foreach($result as $row) {
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
        $directusUiTableGateway = new DirectusUiTableGateway($acl, $zendDb);
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
            $row['ui'] = self::columnTypeToUIType($row['type']);
        }

        // Defualts as system columns
        if ($row["id"] == 'id' || $row["id"] == STATUS_COLUMN_NAME || $row["id"] == 'sort') {
            $row["system"] = true;
            $row["hidden"] = true;
        }

        if (array_key_exists('table_related', $row)) {
            $row['relationship'] = array();
            $row['relationship']['type'] = ArrayUtils::get($row, 'relationship_type');
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

    public static function columnTypeToUIType($column_type) {
        switch($column_type) {
            case "ALIAS":
                return "alias";
            case "MANYTOMANY":
            case "ONETOMANY":
                return "relational";
            case "TINYINT":
                return "checkbox";
            case "MEDIUMBLOB":
            case "BLOB":
                return "blob";
            case "TEXT":
            case "LONGTEXT":
                return "textarea";
            case "CHAR":
            case "VARCHAR":
            case "POINT":
                return "textinput";
            case "DATETIME":
            case "TIMESTAMP":
                return "datetime";
            case "DATE":
                return "date";
            case "TIME":
                return "time";
            case "YEAR":
            case "INT":
            case "BIGINT":
            case "SMALLINT":
            case "MEDIUMINT":
            case "FLOAT":
            case "DOUBLE":
            case "DECIMAL":
                return "numeric";
        }
        return "textinput";
    }

    /**
     *  Get ui options
     *
     *  @param $tbl_name
     *  @param $col_name
     *  @param $datatype_name
     */
     public static function getUIOptions( $tbl_name, $col_name, $datatype_name ) {
        $result = array();
        $item = array();
        $zendDb = Bootstrap::get('zendDb');
        $select = new Select();
        $select->columns([
            'id' => 'ui_name',
            'name',
            'value'
        ]);
        $select->from('directus_ui');
        $select->where([

        ]);
        $select->where([
            'column_name' => $col_name,
            'table_name' => $tbl_name,
            'ui_name' => $datatype_name
        ]);
        $select->order('ui_name');

        $sql = new Sql($zendDb);
        $statement = $sql->prepareStatementForSqlObject($select);
        $rows = $statement->execute();

        foreach($rows as $row) {
            //first case
            if (!isset($ui)) { $item['id'] = $ui = $row['id']; }
            //new ui = new item
            if ($ui != $row['id']) {
                array_push($result, $item);
                $item = array();
                $item['id'] = $ui = $row['id'];
            }
            $item[$row['name']] = $row['value'];
        };
        if (count($item) > 0) {
            array_push($result, $item);
        }
        if (sizeof($result)) {
            return $result[0];
        }
        return array();
     }

}
