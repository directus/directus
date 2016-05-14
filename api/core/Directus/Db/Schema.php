<?php
/**
 * This class will replace TableSchema
 */
namespace Directus\Db;


use Directus\Bootstrap;
use Directus\Util\ArrayUtils;
use Zend\Db\Sql\Ddl\Column\Boolean;
use Zend\Db\Sql\Ddl\Column\Integer;
use Zend\Db\Sql\Ddl\Constraint\PrimaryKey;
use Zend\Db\Sql\Ddl\CreateTable;
use Zend\Db\Sql\Sql;

class Schema
{
    /**
     * Directus core tables
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
     * @param string $name
     * @return void
     */
    public static function createTable($name)
    {
        $table = new CreateTable($name);

        // Primary column
        $primaryColumn = new Integer('id', 11);
        $primaryColumn->setOption('autoincrement', '');
        $table->addColumn($primaryColumn);
        $table->addConstraint(new PrimaryKey('id'));
        // Status column
        $statusColumn = new Boolean(STATUS_COLUMN_NAME);
        $statusColumn->setDefault(STATUS_DRAFT_NUM);
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
     *
     * @return string|array
     */
    public static function addCoreTablePrefix($tables)
    {
        $filterFunction = function($table) {
            // @TODO: Directus tables prefix will be dynamic
            return 'directus_'.$table;
        };

        if (!is_array($tables)) {
            return $filterFunction($tables);
        }

        return array_map($filterFunction, $tables);
    }

    /**
     * Get all Directus core tables name
     *
     * @param array $filterNames
     *
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

    public static function getSupportedDatabases()
    {
        return [
            'mysql' => [
                'id' => 'mysql',
                'name' => 'MySQL/Percona'
            ]
        ];
    }

    public static function getTemplates()
    {
        return [
            'ui_gallery' => [
                'id' => 'ui_gallery',
                'name' => 'UI Gallery'
            ]
        ];
    }
}
