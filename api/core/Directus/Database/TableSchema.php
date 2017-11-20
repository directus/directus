<?php

namespace Directus\Database;

use Directus\Authentication\Provider as Auth;
use Directus\Bootstrap;
use Directus\Config\Config;
use Directus\Database\Exception\ColumnNotFoundException;
use Directus\Database\Object\Column;
use Directus\Database\Object\Table;
use Directus\Database\TableGateway\DirectusPreferencesTableGateway;
use Directus\Exception\Http\ForbiddenException;
use Directus\MemcacheProvider;
use Directus\Util\ArrayUtils;
use Zend\Db\Sql\Predicate\NotIn;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\TableIdentifier;

class TableSchema
{
    /**
     * Schema Manager Instance
     *
     * @var SchemaManager
     */
    protected static $schemaManager = null;

    /**
     * ACL Instance
     *
     * @var \Directus\Permissions\Acl null
     */
    protected static $acl = null;

    /**
     * Connection instance
     *
     * @var \Directus\Database\Connection|null
     */
    protected static $connection = null;

    /**
     * @var Config
     */
    protected static $config = [];

    public static $many_to_one_uis = ['many_to_one', 'single_files'];

    // These columns types are aliases for "associations". They don't have
    // real, corresponding columns in the DB.
    public static $association_types = ['ONETOMANY', 'MANYTOMANY', 'ALIAS'];

    protected $table;
    protected $db;
    protected $_loadedSchema;
    protected static $_schemas = [];
    protected static $_primaryKeys = [];

    /**
     * TRANSITIONAL MAPPER. PENDING BUGFIX FOR MANY TO ONE UIS.
     * key: column_name
     * value: related_table
     * @see  https://github.com/RNGR/directus6/issues/188
     * @var array
     */
    public static $many_to_one_column_name_to_related_table = [
        'group_id' => 'directus_groups',
        'group' => 'directus_groups',

        // These confound me. They'll be ignored and write silent warnings to the API log:
        // 'position'           => '',
        // 'many_to_one'        => '',
        // 'many_to_one_radios => ''
    ];

    /**
     * Get the schema manager instance
     *
     * @return SchemaManager
     */
    public static function getSchemaManagerInstance()
    {
        if (static::$schemaManager === null) {
            static::setSchemaManagerInstance(Bootstrap::get('schemaManager'));
        }

        return static::$schemaManager;
    }

    /**
     * Set the Schema Manager instance
     *
     * @param $schemaManager
     */
    public static function setSchemaManagerInstance($schemaManager)
    {
        static::$schemaManager = $schemaManager;
    }

    /**
     * Get ACL Instance
     *
     * @return \Directus\Permissions\Acl
     */
    public static function getAclInstance()
    {
        if (static::$acl === null) {
            static::setAclInstance(Bootstrap::get('acl'));
        }

        return static::$acl;
    }


    /**
     * Set ACL Instance
     * @param $acl
     */
    public static function setAclInstance($acl)
    {
        static::$acl = $acl;
    }

    /**
     * Get Connection Instance
     *
     * @return \Directus\Database\Connection
     */
    public static function getConnectionInstance()
    {
        if (static::$connection === null) {
            static::setConnectionInstance(Bootstrap::get('zendDb'));
        }

        return static::$connection;
    }

    public static function setConnectionInstance($connection)
    {
        static::$connection = $connection;
    }

    public static function setConfig($config)
    {
        static::$config = $config;
    }

    public static function getStatusMap($tableName)
    {
        $tableObject = static::getTableSchema($tableName);
        $statusMapping = $tableObject->getStatusMapping();

        if (!$statusMapping) {
            $statusMapping = static::$config->get('statusMapping', []);
        }

        if ($statusMapping) {
            array_walk($statusMapping, function (&$status, $key) {
                $status['id'] = $key;
                return $status;
            });
        }

        return $statusMapping;
    }

    /**
     * Gets table schema object
     *
     * @param $tableName
     * @param array $params
     * @param bool $skipCache
     * @param bool $skipAcl
     *
     * @throws ForbiddenException
     *
     * @return Object\Table
     */
    public static function getTableSchema($tableName, array $params = [], $skipCache = false, $skipAcl = false)
    {
        if (!$skipAcl && !static::getAclInstance()->canView($tableName)) {
            throw new ForbiddenException('Permission denied');
        }

        return static::getSchemaManagerInstance()->getTableSchema($tableName, $params, $skipCache);
    }

    /**
     * Gets table columns schema
     *
     * @param string $tableName
     * @param array $params
     * @param bool $skipCache
     *
     * @return Column[]
     */
    public static function getTableColumnsSchema($tableName, array $params = [], $skipCache = false)
    {
        $tableObject = static::getTableSchema($tableName, $params, $skipCache);

        return array_values(array_filter($tableObject->getColumns(), function (Column $column) {
            return static::canReadColumn($column->getTableName(), $column->getName());
        }));
    }

    /**
     * Gets the column object
     *
     * @param string $tableName
     * @param string $columnName
     * @param bool $skipCache
     * @param bool $skipAcl
     *
     * @return Object\Column
     */
    public static function getColumnSchema($tableName, $columnName, $skipCache = false, $skipAcl = false)
    {
        // Due to a problem the way we use to cache using array
        // if a column information is fetched before its table
        // the table is going to be created with only one column
        // to prevent this we always get the table even if we only want one column
        // Stop using getColumnSchema($tableName, $columnName); until we fix this.
        $tableObject = static::getTableSchema($tableName, [], $skipCache, $skipAcl);
        $column = $tableObject->getColumn($columnName);

        return $column;
    }

    /**
     * @todo  for ALTER requests, caching schemas can't be allowed
     */
    /**
     * Gets the table columns schema as array
     *
     * @param $table
     * @param array $params
     * @param bool $skipCache
     *
     * @return array
     */
    public static function getSchemaArray($table, array $params = [], $skipCache = false)
    {
        $columnsSchema = static::getTableColumnsSchema($table, $params, $skipCache);

        // Only return this column if column_name is set as parameter
        $onlyColumnName = ArrayUtils::get($params, 'column_name', null);
        if ($onlyColumnName) {
            foreach($columnsSchema as $key => $column) {
                if ($column['name'] !== $onlyColumnName) {
                    unset($columnsSchema[$key]);
                }
            }
        }

        return count($columnsSchema) == 1 ? reset($columnsSchema) : $columnsSchema;
    }

    /**
     * Checks whether the given table has a status column
     *
     * @param $tableName
     * @param $skipAcl
     *
     * @return bool
     */
    public static function hasStatusColumn($tableName,  $skipAcl = false)
    {
        $schema = static::getTableSchema($tableName, [], false, $skipAcl);

        return $schema->hasStatusColumn();
    }

    /**
     * Checks whether the given table has a status column
     *
     * @param $tableName
     * @param $skipAcl
     *
     * @return bool
     */
    public static function getStatusColumn($tableName,  $skipAcl = false)
    {
        $schema = static::getTableSchema($tableName, [], false, $skipAcl);

        return $schema->getStatusColumn();
    }

    /**
     * Gets tehe column relationship type
     *
     * @param $tableName
     * @param $columnName
     *
     * @return null|string
     */
    public static function getColumnRelationshipType($tableName, $columnName)
    {
        $relationship = static::getColumnRelationship($tableName, $columnName);

        $relationshipType = null;
        if ($relationship) {
            $relationshipType = $relationship->getType();
        }

        return $relationshipType;
    }

    /**
     * Gets Column's relationship
     *
     * @param $tableName
     * @param $columnName
     *
     * @return Object\ColumnRelationship|null
     */
    public static function getColumnRelationship($tableName, $columnName)
    {
        $column = static::getColumnSchema($tableName, $columnName);

        return $column && $column->hasRelationship() ? $column->getRelationship() : null;
    }

    /**
     * Check whether the given table-column has relationship
     *
     * @param $tableName
     * @param $columnName
     *
     * @return bool
     *
     * @throws ColumnNotFoundException
     */
    public static function hasRelationship($tableName, $columnName)
    {
        $tableObject = static::getTableSchema($tableName);
        $columnObject = $tableObject->getColumn($columnName);

        if (!$columnObject) {
            throw new ColumnNotFoundException($columnName);
        }

        return $columnObject->hasRelationship();
    }

    /**
     * Gets related table name
     *
     * @param $tableName
     * @param $columnName
     *
     * @return string
     */
    public static function getRelatedTableName($tableName, $columnName)
    {
        if (!static::hasRelationship($tableName, $columnName)) {
            return null;
        }

        $tableObject = static::getTableSchema($tableName);
        $columnObject = $tableObject->getColumn($columnName);

        return $columnObject->getRelationship()->getRelatedTable();
    }

    // @NOTE: This was copy-paste to Column Object
    /**
     * Whether or not the column name is the name of a system column.
     *
     * @param $interfaceName
     *
     * @return bool
     */
    public static function isSystemColumn($interfaceName)
    {
        return static::getSchemaManagerInstance()->isSystemColumn($interfaceName);
    }

    /**
     * Checks whether the table is a system table
     *
     * @param $tableName
     *
     * @return bool
     */
    public static function isSystemTable($tableName)
    {
        return static::getSchemaManagerInstance()->isSystemTables($tableName);
    }

    /**
     * @param $tableName
     *
     * @return \Directus\Database\Object\Column[] |bool
     */
    public static function getAllTableColumns($tableName)
    {
        $columns = static::getSchemaManagerInstance()->getColumns($tableName);

        $acl = static::getAclInstance();
        $readFieldBlacklist = $acl->getTablePrivilegeList($tableName, $acl::FIELD_READ_BLACKLIST);

        return array_filter($columns, function (Column $column) use ($readFieldBlacklist) {
            return !in_array($column->getName(), $readFieldBlacklist);
        });
    }

    /**
     * @param $tableName
     *
     * @return array
     */
    public static function getAllTableColumnsName($tableName)
    {
        // @TODO: make all these methods name more standard
        // TableColumnsName vs TableColumnNames
        $columns = static::getAllTableColumns($tableName);

        return array_map(function(Column $column) {
            return $column->getName();
        }, $columns);
    }

    public static function getAllNonAliasTableColumnNames($table)
    {
        $columnNames = [];
        $columns = self::getAllNonAliasTableColumns($table);
        if (false === $columns) {
            return false;
        }

        foreach ($columns as $column) {
            $columnNames[] = $column->getId();
        }

        return $columnNames;
    }

    /**
     * Gets the non alias columns from the given table name
     *
     * @param string $tableName
     * @param bool $onlyNames
     *
     * @return \Directus\Database\Object\Column[]|bool
     */
    public static function getAllNonAliasTableColumns($tableName, $onlyNames = false)
    {
        $columns = [];
        $schemaArray = static::getAllTableColumns($tableName);
        if (false === $schemaArray) {
            return false;
        }

        foreach ($schemaArray as $column) {
            if (!$column->isAlias()) {
                $columns[] = $onlyNames === true ? $column->getName() : $column;
            }
        }

        return $columns;
    }

    /**
     * Gets the alias columns from the given table name
     *
     * @param string $tableName
     * @param bool $onlyNames
     *
     * @return \Directus\Database\Object\Column[]|bool
     */
    public static function getAllAliasTableColumns($tableName, $onlyNames = false)
    {
        $columns = [];
        $schemaArray = static::getAllTableColumns($tableName);
        if (false === $schemaArray) {
            return false;
        }

        foreach ($schemaArray as $column) {
            if ($column->isAlias()) {
                $columns[] = $onlyNames === true ? $column->getName() : $column;
            }
        }

        return $columns;
    }

    /**
     * Gets the non alias columns name from the given table name
     *
     * @param string $tableName
     *
     * @return \Directus\Database\Object\Column[]|bool
     */
    public static function getAllNonAliasTableColumnsName($tableName)
    {
        return static::getAllNonAliasTableColumns($tableName, true);
    }

    /**
     * Gets the alias columns name from the given table name
     *
     * @param string $tableName
     *
     * @return \Directus\Database\Object\Column[]|bool
     */
    public static function getAllAliasTableColumnsName($tableName)
    {
        return static::getAllAliasTableColumns($tableName, true);
    }

    public static function getTableColumns($table, $limit = null, $skipIgnore = false)
    {
        if (!self::canGroupViewTable($table)) {
            return [];
        }

        $schemaManager = static::getSchemaManagerInstance();
        $tableObject = $schemaManager->getTableSchema($table);
        $columns = $tableObject->getColumns();
        $columnsName = [];
        $count = 0;
        foreach ($columns as $column) {
            if ($skipIgnore === false
                && (
                    $column->getName() === $tableObject->getStatusColumn()
                    || $column->getName() === $tableObject->getSortColumn()
                    || $column->getName() === $tableObject->getPrimaryColumn()
                )
            ) {
                continue;
            }

            // at least will return one
            if ($limit && $count > $limit) {
                break;
            }

            $columnsName[] = $column->getName();
            $count++;
        }

        return $columnsName;
    }

    public static function getColumnsName($table)
    {
        if (isset(static::$_schemas[$table])) {
            $columns = array_map(function($column) {
                return $column['column_name'];
            }, static::$_schemas[$table]);
        } else {
            $columns = SchemaManager::getColumnsNames($table);
        }

        $names = [];
        foreach($columns as $column) {
            $names[] = $column;
        }

        return $names;
    }

    /**
     * Checks whether or not the given table has a sort column
     *
     * @param $table
     * @param bool $includeAlias
     *
     * @return bool
     */
    public static function hasTableSortColumn($table, $includeAlias = false)
    {
        $column = static::getTableSortColumn($table);

        return static::hasTableColumn($table, $column, $includeAlias);
    }

    public static function hasTableColumn($table, $column, $includeAlias = false, $skipAcl = false)
    {
        $tableObject = static::getTableSchema($table, [], false, $skipAcl);

        $columns = $tableObject->getNonAliasColumnsName();
        if ($includeAlias) {
            $columns = array_merge($columns, $tableObject->getAliasColumnsName());
        }

        if (in_array($column, $columns)) {
            return true;
        }

        return false;
    }

    /**
     * Gets the table sort column name
     *
     * @param $table
     *
     * @return string
     */
    public static function getTableSortColumn($table)
    {
        $tableObject = static::getTableSchema($table);

        $sortColumnName = $tableObject->getSortColumn();
        if (!$sortColumnName) {
            $sortColumnName = $tableObject->getPrimaryColumn() ?: 'id';
        }

        return $sortColumnName;
    }

    public static function getUniqueColumnName($tbl_name)
    {
        // @todo for safe joins w/o name collision
    }


    /**
     * Get all table names
     *
     * @param array $params
     *
     * @return array
     */
    public static function getTablenames(array $params = [])
    {
        $schema = static::getSchemaManagerInstance();
        $result = $schema->getTablesName();
        $includeSystemTables = (bool) ArrayUtils::get($params, 'include_system');

        $tables = [];
        foreach ($result as $tableName) {
            if ($includeSystemTables !== true && $schema->isDirectusTable($tableName)) {
                continue;
            }

            if (self::canGroupViewTable($tableName)) {
                $tables[] = ['name' => $tableName];
            }
        }

        return $tables;
    }

    /**
     * Get info about all tables
     */
    public static function getTables($userGroupId, $versionHash)
    {
        $acl = Bootstrap::get('acl');
        $zendDb = Bootstrap::get('ZendDb');
        $Preferences = new DirectusPreferencesTableGateway($zendDb, $acl);
        $getTablesFn = function () use ($Preferences, $zendDb) {
            $return = [];
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

            foreach ($result as $row) {
                if (!self::canGroupViewTable($row['id'])) {
                    continue;
                }

                $tbl['schema'] = self::getTable($row['id']);
                //$tbl['columns'] = $this->get_table($row['id']);
                $tbl['preferences'] = $Preferences->fetchByUserAndTableAndTitle($currentUser['id'], $row['id']);
                // $tbl['preferences'] = $this->get_table_preferences($currentUser['id'], $row['id']);
                $return[] = $tbl;
            }

            return $return;
        };

        $cacheKey = MemcacheProvider::getKeyDirectusGroupSchema($userGroupId, $versionHash);
        $tables = $Preferences->memcache->getOrCache($cacheKey, $getTablesFn, 10800); // 3 hr cache

        return $tables;
    }

    /**
     * Has the authenticated user permission to view the given table
     *
     * @param $tableName
     *
     * @return bool
     */
    public static function canGroupViewTable($tableName)
    {
        $acl = static::getAclInstance();

        if (! $acl) {
            return true;
        }

        return $acl->canView($tableName);
    }

    /**
     * Has the authenticated user permissions to read the given column
     *
     * @param $tableName
     * @param $columnName
     *
     * @return bool
     */
    public static function canReadColumn($tableName, $columnName)
    {
        $acl = static::getAclInstance();

        if (! $acl) {
            return true;
        }

        return $acl->canReadColumn($tableName, $columnName);
    }

    public static function getTable($tableName)
    {
        $acl = static::getAclInstance();
        $zendDb = static::getConnectionInstance();

        // TODO: getTable should return an empty object
        // or and empty array instead of false
        // in any given situation that the table
        // can be find or used.
        if (!self::canGroupViewTable($tableName)) {
            return false;
        }

        $info = static::getSchemaManagerInstance()->getTableSchema($tableName);

        if (!$info) {
            return false;
        }

        $info = $info->toArray();
        $info['columns'] = array_values(array_filter($info['columns'], function ($column) {
            return static::canReadColumn($column['table_name'], $column['name']);
        }));

        if (isset($info['columns'])) {
            // $columns = $info['columns'];
            $info['columns'] = [
                'meta' => [
                    'table' => 'directus_columns',
                    'type' => 'collection'
                ],
                'data' => $info['columns']
            ];
        }

        $directusPreferencesTableGateway = new DirectusPreferencesTableGateway($zendDb, $acl);
        $currentUserId = static::getAclInstance()->getUserId();
        $info['preferences'] = $directusPreferencesTableGateway->fetchByUserAndTable($currentUserId, $tableName);

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

        $schemaManager = static::getSchemaManagerInstance();//Bootstrap::get('schemaManager');

        $columnName = $schemaManager->getPrimaryKey($tableName);

        return self::$_primaryKeys[$tableName] = $columnName;
    }

    protected static function createParamArray($values, $prefix)
    {
        $result = [];

        foreach ($values as $i => $field) {
            $result[$prefix . $i] = $field;
        }

        return $result;
    }

    public static function getAllSchemas($userGroupId, $versionHash)
    {
        $cacheKey = MemcacheProvider::getKeyDirectusGroupSchema($userGroupId, $versionHash);
        $acl = Bootstrap::get('acl');
        $ZendDb = Bootstrap::get('ZendDb');
        $auth = Bootstrap::get('auth');
        $directusPreferencesTableGateway = new DirectusPreferencesTableGateway($ZendDb, $acl);

        $getPreferencesFn = function () use ($directusPreferencesTableGateway, $auth) {
            $currentUser = $auth->getUserInfo();
            $preferences = $directusPreferencesTableGateway->fetchAllByUser($currentUser['id']);

            return $preferences;
        };

        $getSchemasFn = function () {
            /** @var Table[] $tableSchemas */
            $tableSchemas = TableSchema::getTablesSchema(['include_system' => true]);
            $columnSchemas = TableSchema::getColumnsSchema(['include_system' => true]);
            // Nest column schemas in table schemas
            foreach ($tableSchemas as &$table) {
                $table->setColumns($columnSchemas[$table->getName()]);

                $table = $table->toArray();
                $tableName = $table['id'];
                $table['columns'] = array_map(function(Column $column) {
                    return $column->toArray();
                }, array_values($columnSchemas[$tableName]));

                $table = [
                    'schema' => $table,
                ];
            }

            return $tableSchemas;
        };

        // 3 hr cache
        // $schemas = $directusPreferencesTableGateway->memcache->getOrCache($cacheKey, $getSchemasFn, 10800);
        $schemas = $getSchemasFn();

        // Append preferences post cache
        $preferences = $getPreferencesFn();
        foreach ($schemas as &$table) {
            $table['preferences'] = ArrayUtils::get($preferences, $table['schema']['id']);
        }

        return $schemas;
    }

    /**
     * Get all the tables schema
     *
     * @param array $params
     * @param bool $skipAcl
     *
     * @return array
     */
    public static function getTablesSchema(array $params = [], $skipAcl = false)
    {
        $schema = static::getSchemaManagerInstance();
        $includeSystemTables = ArrayUtils::get($params, 'include_system', false);
        $includeColumns = ArrayUtils::get($params, 'include_columns', false);

        $allTables = $schema->getTables();
        if ($includeColumns === true) {
            $columns = $schema->getAllColumnsByTable();
            foreach($columns as $table => $column) {
                // Make sure the table exists
                if (isset($allTables[$table])) {
                    $allTables[$table]->setColumns($column);
                }
            }
        }

        $tables = [];
        foreach ($allTables as $table) {
            $tableName = $table->getName();
            if ($includeSystemTables !== true && $schema->isDirectusTable($tableName)) {
                continue;
            }
            // Only include tables w ACL privileges
            if ($skipAcl === false && !self::canGroupViewTable($tableName)) {
                continue;
            }

            $tables[] = $table;
        }

        return $tables;
    }

    public static function getColumnsSchema(array $params = [])
    {
        $schema = static::getSchemaManagerInstance();
        $includeSystemTables = ArrayUtils::get($params, 'include_system', false);

        $columns = [];
        foreach($schema->getAllColumns() as $column) {
            $tableName = $column->getTableName();

            if (! static::canReadColumn($tableName, $column->getName())) {
                continue;
            }

            if ($schema->isDirectusTable($tableName) && ! $includeSystemTables) {
                continue;
            }

            // Only include tables w ACL privileges
            if (! static::canGroupViewTable($tableName)) {
                continue;
            }

            $columns[$tableName][] = $column;
        }

        return $columns;
    }

    public static function columnTypeToUIType($type)
    {
        return static::getSchemaManagerInstance()->getColumnDefaultInterface($type);
    }
}
