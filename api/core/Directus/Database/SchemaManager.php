<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2016 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Database;

use Directus\Bootstrap;
use Directus\Database\Object\Column;
use Directus\Database\Object\Table;
use Directus\Database\Schemas\Sources\SchemaInterface;
use Directus\Util\ArrayUtils;
use Directus\Database\Ddl\Column\Boolean;
use Zend\Db\Sql\Ddl\Column\Integer;
use Zend\Db\Sql\Ddl\Constraint\PrimaryKey;
use Zend\Db\Sql\Ddl\CreateTable;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Sql;

/**
 * Schema Manager
 *
 * This class will replace TableSchema
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class SchemaManager
{
    /**
     * Schema object instance
     *
     * @var \Directus\Database\Schemas\Sources\SchemaInterface
     */
    protected $schema;

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

    public function __construct(SchemaInterface $schema)
    {
        $this->schema = $schema;
    }

    /**
     * Create a new table
     *
     * @param string $name
     * @return void
     */
    public function createTable($name)
    {
        $table = new CreateTable($name);

        // Primary column
        $primaryColumn = new Integer('id');
        $primaryColumn->setOption('autoincrement', '');
        $table->addColumn($primaryColumn);
        $table->addConstraint(new PrimaryKey('id'));
        // Status column
        $statusColumn = new Boolean(STATUS_COLUMN_NAME, false, STATUS_DRAFT_NUM);
        $table->addColumn($statusColumn);

        $connection = Bootstrap::get('ZendDb');
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
            $tableResult = $this->schema->getTable($tableName);
            $tableData = $tableResult->current();

            // Create a table object based of the table schema data
            $tableSchema = new Table(array_merge($tableData, [
                'schema' => $this->schema->getSchemaName()
            ]));

            // save the column into the data
            // @NOTE: this is the early implmenetation of cache
            // soon this will be change to cache
            $this->data['tables'][$tableName] = $tableSchema;
        }

        // Set table columns
        $tableColumns = $this->getColumns($tableName);
        $tableSchema->setColumns($tableColumns);

        return $tableSchema;
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
        return $this->schema->tableExists($tableName);
    }

    /**
     * Check if one or more table in the list exists.
     *
     * @param array $tablesName
     * @return bool
     */
    public function someTableExists(array $tablesName)
    {
        return $this->schema->someTableExists($tablesName);
    }

    public function getTables($filter = [])
    {
        // TODO: Filter should be outsite
        // $schema = Bootstrap::get('schema');
        // $config = Bootstrap::get('config');

        // $ignoredTables = static::getDirectusTables(DirectusPreferencesTableGateway::$IGNORED_TABLES);
        // $blacklistedTable = $config['tableBlacklist'];
        // array_merge($ignoredTables, $blacklistedTable)
        return $this->schema->getTables($filter);
    }

    public function getTablesName()
    {
        $rows = $this->schema->getTablesName();

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
            $columnsResult = $this->schema->getColumns($tableName, $params);
            $columnsSchema = [];
            foreach($columnsResult as $column) {
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
                $columnsSchema[] = $columnObject;
            }

            $this->data['columns'][$tableName] = $columnsSchema;
        }

        foreach($columnsSchema as $column) {
            $column->setOptions($this->getColumnUIOptions($tableName, $column));
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
            $columnOptions = $this->getUIOptions($tableName, $column->getName(), $column->getUI());
            if (!isset($this->data['options'][$tableName])) {
                $this->data['options'][$tableName] = [];
            }

            $this->data['options'][$tableName][$column->getName()] = $columnOptions;
        }

        return $columnOptions;
    }

    public function getUIOptions($table, $column, $ui)
    {
        $result = [];
        $item = [];
        $zendDb = $this->schema->getConnection();
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
            'column_name' => $column,
            'table_name' => $table,
            'ui_name' => $ui
        ]);
        $select->order('ui_name');

        $sql = new Sql($zendDb);
        $statement = $sql->prepareStatementForSqlObject($select);
        $rows = $statement->execute();

        foreach ($rows as $row) {
            //first case
            if (!isset($ui)) {
                $item['id'] = $ui = $row['id'];
            }
            //new ui = new item
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

    public function getAllColumns()
    {
        return iterator_to_array($this->schema->getAllColumns());
    }

    public function getPrimaryKey($tableName)
    {
        return $this->schema->getPrimaryKey($tableName);
    }

    public function castRecordValues($records, $columns)
    {
        return $this->schema->castRecordValues($records, $columns);
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
        return $this->schema;
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
}
