<?php
/**
 * This class will replace TableSchema
 */
namespace Directus\Db;


use Directus\Bootstrap;
use Zend\Db\Sql\Ddl\Column\Boolean;
use Zend\Db\Sql\Ddl\Column\Integer;
use Zend\Db\Sql\Ddl\Constraint\PrimaryKey;
use Zend\Db\Sql\Ddl\CreateTable;
use Zend\Db\Sql\Sql;

class Schema
{
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
