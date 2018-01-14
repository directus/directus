<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Database;

use Directus\Database\Ddl\Column\Boolean;
use Directus\Database\Exception\TableNotFoundException;
use Directus\Database\Object\Column;
use Directus\Database\Object\Table;
use Directus\Database\Schemas\Sources\SchemaInterface;
use Directus\Util\ArrayUtils;
use Directus\Util\StringUtils;
use Zend\Db\Sql\Ddl\Column\Integer;
use Zend\Db\Sql\Ddl\Constraint\PrimaryKey;
use Zend\Db\Sql\Ddl\CreateTable;
use Zend\Db\Sql\Sql;

/**
 * Schema Manager
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class SchemaManager
{
    // Names of the system interfaces
    // former system columns
    const INTERFACE_PRIMARY_KEY = 'primary_key';
    const INTERFACE_STATUS = 'status';
    const INTERFACE_SORT = 'sort';
    const INTERFACE_DATE_CREATED = 'date_created';
    const INTERFACE_DATE_MODIFIED = 'date_modified';
    const INTERFACE_USER_CREATED = 'user_created';
    const INTERFACE_USER_MODIFIED = 'user_modified';

    /**
     * Schema source instance
     *
     * @var \Directus\Database\Schemas\Sources\SchemaInterface
     */
    protected $source;

    /**
     * Schema data information
     *
     * @var array
     */
    protected $data = [];

    /**
     * System table prefix
     *
     * @var string
     */
    protected $prefix = 'directus_';

    /**
     * Directus System tables
     *
     * @var array
     */
    protected $directusTables = [
        'activity',
        'bookmarks',
        'columns',
        'files',
        'groups',
        'messages',
        'messages_recipients',
        'preferences',
        'privileges',
        'schema_migrations',
        'settings',
        'tables',
        'users'
    ];

    public function __construct(SchemaInterface $source)
    {
        $this->source = $source;
    }

    /**
     * Create a new table
     *
     * @param string $name
     * @param array $columnsName
     *
     * @return void
     */
    public function createTable($name, $columnsName = [])
    {
        $table = new CreateTable($name);
        if (!is_array($columnsName)) {
            $columnsName = [$columnsName];
        }

        // Primary column
        $primaryColumn = new Integer('id');
        $primaryColumn->setOption('autoincrement', true);
        $table->addColumn($primaryColumn);
        $table->addConstraint(new PrimaryKey('id'));

        // Status column
        if (in_array('status', $columnsName)) {
            $statusColumn = new Boolean(STATUS_COLUMN_NAME, false, STATUS_DRAFT_NUM);
            $table->addColumn($statusColumn);
        }

        // Sort column
        if (in_array('sort', $columnsName)) {
            $sortColumn = new Integer('sort');
            $sortColumn->setOption('unsigned', true);
            $sortColumn->setNullable(true);
            $sortColumn->setDefault(null);
            $table->addColumn($sortColumn);
        }

        $connection = $this->source->getConnection();
        $sql = new Sql($connection);

        $connection->query(
            $sql->getSqlStringForSqlObject($table),
            $connection::QUERY_MODE_EXECUTE
        );
    }

    /**
     * Adds a primary key to the given column
     *
     * @param $table
     * @param $column
     *
     * @return bool
     */
    public function addPrimaryKey($table, $column)
    {
        return $this->source->addPrimaryKey($table, $column);
    }

    /**
     * Removes the primary key of the given column
     *
     * @param $table
     * @param $column
     *
     * @return bool
     */
    public function dropPrimaryKey($table, $column)
    {
        return $this->source->dropPrimaryKey($table, $column);
    }

    /**
     * Get the table schema information
     *
     * @param string $tableName
     * @param array  $params
     * @param bool   $skipCache
     *
     * @throws TableNotFoundException
     *
     * @return \Directus\Database\Object\Table
     */
    public function getTableSchema($tableName, $params = [], $skipCache = false)
    {
        $tableSchema = ArrayUtils::get($this->data, 'tables.' . $tableName, null);
        if (!$tableSchema || $skipCache) {
            // Get the table schema data from the source
            $tableResult = $this->source->getTable($tableName);
            $tableData = $tableResult->current();

            if (!$tableData) {
                throw new TableNotFoundException($tableName);
            }

            // Create a table object based of the table schema data
            $tableSchema = $this->createTableObjectFromArray(array_merge($tableData, [
                'schema' => $this->source->getSchemaName()
            ]));
            $this->addTable($tableName, $tableSchema);
        }

        // =============================================================================
        // Set table columns
        // -----------------------------------------------------------------------------
        // @TODO: Do not allow to add duplicate column names
        // =============================================================================
        if (empty($tableSchema->getColumns())) {
            $tableColumns = $this->getColumns($tableName);
            $tableSchema->setColumns($tableColumns);
        }

        return $tableSchema;
    }

    /**
     * Gets column schema
     *
     * @param $tableName
     * @param $columnName
     * @param bool $skipCache
     *
     * @return Column
     */
    public function getColumnSchema($tableName, $columnName, $skipCache = false)
    {
        $columnSchema = ArrayUtils::get($this->data, 'columns.' . $tableName . '.' . $columnName, null);

        if (!$columnSchema || $skipCache) {
            // Get the column schema data from the source
            $columnResult = $this->source->getColumns($tableName, ['column_name' => $columnName]);
            $columnData = $columnResult->current();

            // Create a column object based of the table schema data
            $columnSchema = $this->createColumnObjectFromArray($columnData);
            $this->addColumn($columnSchema);
        }

        return $columnSchema;
    }

    /**
     * Add the system table prefix to to a table name.
     *
     * @param string $tables
     *
     * @return string|array
     */
    public function addSystemTablePrefix($tables)
    {
        $filterFunction = function ($table) {
            // @TODO: Directus tables prefix will be dynamic
            return $this->prefix . $table;
        };

        if (!is_array($tables)) {
            return $filterFunction($tables);
        }

        return array_map($filterFunction, $tables);
    }

    /**
     * @deprecated 6.4.4 See addSystemTablesPrefix
     *
     * @param $tables
     *
     * @return array|string
     */
    public function addCoreTablePrefix($tables)
    {
        return $this->addSystemTablePrefix($tables);
    }

    /**
     * Get Directus System tables name
     *
     * @return array
     */
    public function getSystemTables()
    {
        return $this->addSystemTablePrefix($this->directusTables);
    }

    /**
     * @deprecated 6.4.4 See getSystemTables
     *
     * @return array
     */
    public function getCoreTables()
    {
        return $this->getSystemTables();
    }

    /**
     * Check if the given name is a system table
     *
     * @param $name
     *
     * @return bool
     */
    public function isSystemTables($name)
    {
        return in_array($name, $this->getSystemTables());
    }

    /**
     * Check if a table name exists
     *
     * @param $tableName
     * @return bool
     */
    public function tableExists($tableName)
    {
        return $this->source->tableExists($tableName);
    }

    /**
     * Check if one or more table in the list exists.
     *
     * @param array $tablesName
     * @return bool
     */
    public function someTableExists(array $tablesName)
    {
        return $this->source->someTableExists($tablesName);
    }

    /**
     * Gets list of table
     *
     * @param array $params
     *
     * @return Table[]
     */
    public function getTables(array $params = [])
    {
        // TODO: Filter should be outsite
        // $schema = Bootstrap::get('schema');
        // $config = Bootstrap::get('config');

        // $ignoredTables = static::getDirectusTables(DirectusPreferencesTableGateway::$IGNORED_TABLES);
        // $blacklistedTable = $config['tableBlacklist'];
        // array_merge($ignoredTables, $blacklistedTable)
        $allTables = $this->source->getTables($params);

        $tables = [];
        foreach($allTables as $tableData) {
            // Create a table object based of the table schema data
            $tableSchema = $this->createTableObjectFromArray(array_merge($tableData, [
                'schema' => $this->source->getSchemaName()
            ]));
            $tableName = $tableSchema->getName();
            $this->addTable($tableName, $tableSchema);

            $tables[$tableName] = $tableSchema;
        }

        return $tables;
    }

    public function getTablesName()
    {
        $rows = $this->source->getTablesName();

        $tables = [];
        foreach ($rows as $row) {
            $tables[] = $row['table_name'];
        }

        return $tables;
    }

    /**
     * Get all columns in the given table name
     *
     * @param $tableName
     * @param array $params
     *
     * @return \Directus\Database\Object\Column[]
     */
    public function getColumns($tableName, $params = [])
    {
        // TODO: filter black listed fields
        // $acl = Bootstrap::get('acl');
        // $blacklist = $readFieldBlacklist = $acl->getTablePrivilegeList($tableName, $acl::FIELD_READ_BLACKLIST);

        $columnsSchema = ArrayUtils::get($this->data, 'columns.' . $tableName, null);
        if (!$columnsSchema) {
            $columnsResult = $this->source->getColumns($tableName, $params);
            $columnsSchema = [];
            foreach($columnsResult as $column) {
                $columnsSchema[] = $this->createColumnObjectFromArray($column);
            }

            $this->data['columns'][$tableName] = $columnsSchema;
        }

        return $columnsSchema;
    }

    public function getColumnsName($tableName)
    {
        $columns = $this->getColumns($tableName);

        $columnNames = [];
        foreach ($columns as $column) {
            $columnNames[] = $column->getName();
        }

        return $columnNames;
    }

    /**
     * Get all the columns
     *
     * @return Column[]
     */
    public function getAllColumns()
    {
        $allColumns = $this->source->getAllColumns();

        $columns = [];
        foreach($allColumns as $column) {
            $columns[] = $this->createColumnObjectFromArray($column);
        }

        return $columns;
    }

    /**
     * Get a list of columns table grouped by table name
     *
     * @return array
     */
    public function getAllColumnsByTable()
    {
        $columns = [];
        foreach($this->getAllColumns() as $column) {
            $tableName = $column->getTableName();
            if (!isset($columns[$tableName])) {
                $columns[$tableName] = [];
            }

            $columns[$tableName][] = $column;
        }

        return $columns;
    }

    public function getPrimaryKey($tableName)
    {
        return $this->source->getPrimaryKey($tableName);
    }

    public function hasSystemDateColumn($tableName)
    {
        $tableObject = $this->getTableSchema($tableName);

        return $tableObject->getDateCreateColumn() || $tableObject->getDateUpdateColumn();
    }

    public function castRecordValues($records, $columns)
    {
        return $this->source->castRecordValues($records, $columns);
    }

    /**
     * Cast value against a database type
     *
     * NOTE: it only works with MySQL data types
     *
     * @param $value
     * @param $type
     * @param $length
     *
     * @return mixed
     */
    public function castValue($value, $type = null, $length = false)
    {
        return $this->source->castValue($value, $type, $length);
    }

    /**
     * Checks whether the given type is numeric type
     *
     * @param $type
     *
     * @return bool
     */
    public function isNumericType($type)
    {
        return $this->source->isNumericType($type);
    }

    /**
     * Checks whether the given type is string type
     *
     * @param $type
     *
     * @return bool
     */
    public function isStringType($type)
    {
        return $this->source->isStringType($type);
    }

    /**
     * Checks whether the given type is integer type
     *
     * @param $type
     *
     * @return bool
     */
    public function isIntegerType($type)
    {
        return $this->source->isIntegerType($type);
    }

    /**
     * Checks whether the given type is decimal type
     *
     * @param $type
     *
     * @return bool
     */
    public function isDecimalType($type)
    {
        return $this->source->isDecimalType($type);
    }

    /**
     * Cast default value
     *
     * @param $value
     * @param $type
     * @param $length
     *
     * @return mixed
     */
    public function castDefaultValue($value, $type, $length = null)
    {
        if (strtolower($value) === 'null') {
            $value = null;
        } else {
            $value = $this->castValue($value, $type, $length);
        }

        return $value;
    }

    /**
     * Get all Directus system tables name
     *
     * @param array $filterNames
     *
     * @return array
     */
    public function getDirectusTables(array $filterNames = [])
    {
        $tables = $this->directusTables;
        if ($filterNames) {
            foreach ($tables as $i => $table) {
                if (!in_array($table, $filterNames)) {
                    unset($tables[$i]);
                }
            }
        }

        return $this->addSystemTablePrefix($tables);
    }

    /**
     * Check if a given table is a directus system table name
     *
     * @param $tableName
     *
     * @return bool
     */
    public function isDirectusTable($tableName)
    {
        return in_array($tableName, $this->getDirectusTables());
    }

    /**
     * Get the schema adapter
     *
     * @return SchemaInterface
     */
    public function getSchema()
    {
        return $this->source;
    }

    /**
     * List of supported databases
     *
     * @return array
     */
    public static function getSupportedDatabases()
    {
        return [
            'mysql' => [
                'id' => 'mysql',
                'name' => 'MySQL/Percona'
            ],
        ];
    }

    public static function getTemplates()
    {
        // @TODO: SchemaManager shouldn't be a class with static methods anymore
        // the UI templates list will be provided by a container or bootstrap.
        $path = implode(DIRECTORY_SEPARATOR, [
            BASE_PATH,
            'api',
            'migrations',
            'templates',
            '*'
        ]);

        $templatesDirs = glob($path, GLOB_ONLYDIR);
        $templatesData = [];
        foreach ($templatesDirs as $dir) {
            $key = basename($dir);
            $templatesData[$key] = [
                'id' => $key,
                'name' => uc_convert($key)
            ];
        }

        return $templatesData;
    }

    public function createTableObjectFromArray($data)
    {
        return new Table($data);
    }

    /**
     * Adds fixed core table columns information such as system columns name
     *
     * @param array $column
     *
     * @return array
     */
    public function parseSystemTablesColumn(array $column)
    {
        $tableName = ArrayUtils::get($column, 'table_name');
        $columnName = ArrayUtils::get($column, 'column_name');

        if (!StringUtils::startsWith($tableName, $this->prefix)) {
            return $column;
        }

        // Status
        $hasStatus = in_array($tableName, $this->getDirectusTables(['users', 'files']));
        if ($columnName == 'status' && $hasStatus) {
            $column['ui'] = static::INTERFACE_STATUS;
        }

        return $column;
    }

    /**
     * @deprecated 6.4.4 See parseSystemTablesColumn
     *
     * @param array $column
     *
     * @return array
     */
    public function parseCoreTablesColumn(array $column)
    {
        return $this->parseSystemTablesColumn($column);
    }

    /**
     * Creates a column object from the given array
     *
     * @param array $column
     *
     * @return Column
     */
    public function createColumnObjectFromArray($column)
    {
        if (!isset($column['ui'])) {
            $column['ui'] = $this->getColumnDefaultInterface($column['type']);
        }

        $column = $this->parseCoreTablesColumn($column);

        $options = json_decode(ArrayUtils::get($column, 'options', ''), true);
        $column['options'] = $options ? $options : [];

        $isSystemColumn = $this->isSystemColumn($column['ui']);
        $column['system'] = $isSystemColumn;

        // PRIMARY KEY must be required
        if (ArrayUtils::get($column, 'key') === 'PRI') {
            $column['required'] = true;
        }

        // NOTE: Alias column must are nullable
        if (ArrayUtils::get($column, 'type') === 'ALIAS') {
            $column['is_nullable'] = 'YES';
        }

        // NOTE: MariaDB store "NULL" as a string on some data types such as VARCHAR.
        // We reserved the word "NULL" on nullable data type to be actually null
        if (ArrayUtils::get($column, 'is_nullable') === 'YES' && ArrayUtils::get($column, 'default_value') == 'NULL') {
            $column['default_value'] = null;
        }

        $columnObject = new Column($column);
        if (isset($column['related_table'])) {
            $columnObject->setRelationship([
                'type' => ArrayUtils::get($column, 'relationship_type'),
                'related_table' => ArrayUtils::get($column, 'related_table'),
                'junction_table' => ArrayUtils::get($column, 'junction_table'),
                'junction_key_right' => ArrayUtils::get($column, 'junction_key_right'),
                'junction_key_left' => ArrayUtils::get($column, 'junction_key_left'),
            ]);
        }

        return $columnObject;
    }

    /**
     * Checks whether the column UI is a system column
     *
     * @param $columnUI
     *
     * @return bool
     */
    public function isSystemColumn($columnUI)
    {
        $systemFields = [
            static::INTERFACE_PRIMARY_KEY,
            static::INTERFACE_SORT,
            static::INTERFACE_STATUS,
            static::INTERFACE_DATE_CREATED,
            static::INTERFACE_DATE_MODIFIED,
            static::INTERFACE_USER_CREATED,
            static::INTERFACE_USER_MODIFIED
        ];

        return in_array($columnUI, $systemFields);
    }

    protected function addTable($name, $schema)
    {
        // save the column into the data
        // @NOTE: this is the early implementation of cache
        // soon this will be change to cache
        $this->data['tables'][$name] = $schema;
    }

    protected function addColumn(Column $column)
    {
        $tableName = $column->getTableName();
        $columnName = $column->getName();
        $this->data['columns'][$tableName][$columnName] = $column;
    }

    /**
     * Gets the data types default interfaces
     *
     * @return array
     */
    public function getDefaultInterfaces()
    {
        return $this->source->getDefaultInterfaces();
    }

    /**
     * Gets the given data type default interface
     *
     * @param $type
     *
     * @return string
     */
    public function getColumnDefaultInterface($type)
    {
        return $this->source->getColumnDefaultInterface($type);
    }
}
