<?php
/**
 * This class will replace TableSchema
 */
namespace Directus\Db;

use Directus\Bootstrap;
use Directus\Util\ArrayUtils;
use Directus\Database\Ddl\Column\Boolean;
use Zend\Db\Sql\Ddl\Column\Integer;
use Zend\Db\Sql\Ddl\Constraint\PrimaryKey;
use Zend\Db\Sql\Ddl\CreateTable;
use Zend\Db\Sql\Sql;

class SchemaManager
{
    /**
     * Directus core tables
     *
     * @var array
     */
    protected static $directusTables = [
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

    /**
     * Create a new table
     *
     * @param string $name
     * @return void
     */
    public static function createTable($name)
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
     * Add the core table prefix to to a table name.
     *
     * @param $tables
     * @return string|array
     */
    public static function addCoreTablePrefix($tables)
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
    public static function getCoreTables()
    {
        return static::addCoreTablePrefix(static::$directusTables);
    }

    /**
     * Check if a table name exists
     *
     * @param $tableName
     * @return bool
     */
    public static function tableExists($tableName)
    {
        $schema = Bootstrap::get('schema');

        return $schema->tableExists($tableName);
    }

    /**
     * Check if one or more table in the list exists.
     *
     * @param array $tablesName
     * @return bool
     */
    public static function someTableExists(array $tablesName)
    {
        $schema = Bootstrap::get('schema');

        return $schema->someTableExists($tablesName);
    }

    /**
     * Proxy method calls to the current database schema object
     *
     * @param $name
     * @param $arguments
     * @return mixed
     */
    public static function __callStatic($name, $arguments)
    {
        $schema = Bootstrap::get('schema');

        return call_user_func_array([$schema, $name], $arguments);
    }

    /**
     * Get all Directus core tables name
     *
     * @param array $filterNames
     * @return array
     */
    public static function getDirectusTables(array $filterNames = [])
    {
        $tables = static::$directusTables;
        if ($filterNames) {
            $tables = ArrayUtils::pick($tables, $filterNames);
        }

        return static::addCoreTablePrefix($tables);
    }

    /**
     * Check if a given table is a directus core table name
     *
     * @param $tableName
     * @return bool
     */
    public static function isDirectusTable($tableName)
    {
        return in_array($tableName, static::getDirectusTables());
    }

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
