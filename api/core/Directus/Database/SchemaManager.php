<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2016 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Database;

use Directus\Database\Ddl\Column\Boolean;
use Directus\Database\Object\Column;
use Directus\Database\Object\Table;
use Directus\Database\Schemas\Sources\SchemaInterface;
use Directus\Util\ArrayUtils;
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
     * Directus core tables
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
        'ui',
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
     *
     * @return void
     */
    public function createTable($name)
    {
        $table = new CreateTable($name);

        // Primary column
        $primaryColumn = new Integer('id');
        $primaryColumn->setOption('autoincrement', true);
        $table->addColumn($primaryColumn);
        $table->addConstraint(new PrimaryKey('id'));
        // Status column
        $statusColumn = new Boolean(STATUS_COLUMN_NAME, false, STATUS_DRAFT_NUM);
        $table->addColumn($statusColumn);

        $connection = $this->source->getConnection();
        $sql = new Sql($connection);

        $connection->query(
            $sql->getSqlStringForSqlObject($table),
            $connection::QUERY_MODE_EXECUTE
        );
    }


    /**
     * Get the table schema information
     *
     * @param string $tableName
     * @param array  $params
     * @param bool   $fromCache
     *
     * @return \Directus\Database\Object\Table
     */
    public function getTableSchema($tableName, $params = [], $fromCache = true)
    {
        $tableSchema = ArrayUtils::get($this->data, 'tables.' . $tableName, null);
        if (!$tableSchema) {
            // Get the table schema data from the source
            $tableResult = $this->source->getTable($tableName);
            $tableData = $tableResult->current();

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

    public function getColumnSchema($tableName, $columnName, $fromCache = false)
    {
        $columnSchema = ArrayUtils::get($this->data, 'columns.' . $tableName . '.' . $columnName, null);

        if (!$columnSchema) {
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
     * Add the core table prefix to to a table name.
     *
     * @param string $tables
     *
     * @return string|array
     */
    public function addCoreTablePrefix($tables)
    {
        $filterFunction = function ($table) {
            // @TODO: Directus tables prefix will be dynamic
            return 'directus_' . $table;
        };

        if (!is_array($tables)) {
            return $filterFunction($tables);
        }

        return array_map($filterFunction, $tables);
    }

    /**
     * Get Directus Core tables name
     *
     * @return array
     */
    public function getCoreTables()
    {
        return $this->addCoreTablePrefix($this->directusTables);
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

            $columnsUIOptions = $this->getTableUIOptions($tableName);
            foreach($columnsSchema as $column) {
                $options = ArrayUtils::get($columnsUIOptions, $column->getName(), []);
                $column->setUIOptions($options);
            }
        }

        return $columnsSchema;
    }

    /**
     * Get the Column UI options
     *
     * @param $tableName
     * @param Column $column
     *
     * @return array
     */
    public function getColumnUIOptions($tableName, Column $column)
    {
        $columnOptionsKey = implode('.', ['options', $tableName, $column->getName()]);
        $columnOptions = ArrayUtils::get($this->data, $columnOptionsKey, null);

        if (!$columnOptions) {
            $columnOptions = $this->getUIOptions($column);
            if (!isset($this->data['options'][$tableName])) {
                $this->data['options'][$tableName] = [];
            }

            $this->data['options'][$tableName][$column->getName()] = $columnOptions;
        }

        return $columnOptions;
    }

    public function getTableUIOptions($tableName)
    {
        $result = [];
        $rows = $this->source->getTableUIOptions($tableName);

        foreach ($rows as $row) {
            if (!isset($result[$row['column_name']])) {
                $result[$row['column_name']] = [];
            }

            $result[$row['column_name']][$row['name']] = $row['value'];
        };

        return $result;
    }

    public function getUIOptions(Column $column)
    {
        $result = [];
        $item = [];
        $rows = $this->source->getUIOptions($column);

        foreach ($rows as $row) {
            // first case
            if (!isset($ui)) {
                $item['id'] = $ui = $row['id'];
            }

            // new ui = new item
            if ($ui != $row['id']) {
                array_push($result, $item);
                $item = [];
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

        return [];
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

    public function castRecordValues($records, $columns)
    {
        return $this->source->castRecordValues($records, $columns);
    }

    /**
     * Get all Directus core tables name
     *
     * @param array $filterNames
     *
     * @return array
     */
    public function getDirectusTables(array $filterNames = [])
    {
        $tables = $this->directusTables;
        if ($filterNames) {
            $tables = ArrayUtils::pick($tables, $filterNames);
        }

        return $this->addCoreTablePrefix($tables);
    }

    /**
     * Check if a given table is a directus core table name
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

    public function createColumnObjectFromArray($column)
    {
        if (!isset($column['ui'])) {
            $column['ui'] = $this->getColumnDefaultUI($column['type']);
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

    public function getColumnDefaultUI($type)
    {
        return $this->source->getColumnDefaultUI($type);
    }
}
