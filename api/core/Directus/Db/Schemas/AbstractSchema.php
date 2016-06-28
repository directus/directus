<?php

namespace Directus\Db\Schemas;


abstract class AbstractSchema implements SchemaInterface
{
    /**
     * Database connection adapter
     * @var \Zend\DB\Adapter\Adapter
     */
    protected $adapter;

    /**
     * AbstractSchema constructor.
     * @param $adapter
     */
    public function __construct($adapter)
    {
        $this->adapter = $adapter;
    }

    /**
     * @inheritdoc
     */
    abstract public function getTables();

    /**
     * @inheritdoc
     */
    abstract public function getTablesName();

    /**
     * @inheritdoc
     */
    abstract public function hasTable($tableName);

    /**
     * @inheritdoc
     */
    abstract public function getTable($tableName);

    /**
     * @inheritdoc
     */
    abstract public function getColumns($tableName, $params = null);

    public function getColumnsNames($tableName)
    {
        $columns = $this->getColumns($tableName);

        $columnNames = [];
        foreach($columns as $column) {
            $columnNames[] = $column['column_name'];
        }

        return $columnNames;
    }

    /**
     * @inheritdoc
     */
    abstract public function hasColumn($tableName, $columnName);

    /**
     * @inheritdoc
     */
    abstract public function getColumn($tableName, $columnName);

    /**
     * @inheritdoc
     */
    abstract public function hasPrimaryKey($tableName);

    /**
     * @inheritdoc
     */
    abstract public function getPrimaryKey($tableName);

    /**
     * @inheritdoc
     */
    abstract public function getFullSchema();

    /**
     * @inheritdoc
     */
    abstract public function getUIOptions($tableName, $columnName);

    /**
     * @inheritdoc
     */
    abstract public function getColumnUI($column);
}
