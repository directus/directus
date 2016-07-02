<?php

namespace Directus\Db\Schemas;

interface SchemaInterface
{
    /**
     * Get a list of all tables structures.
     *
     * @return array
     */
    public function getTables();

    /**
     * Get a list of all tables names.
     *
     * @return array
     */
    public function getTablesName();

    /**
     * Check if the given table name exists
     *
     * @param $tableName
     *
     * @return bool
     */
    public function hasTable($tableName);

    /**
     * Get the structure of the given table name.
     *
     * @param $tableName
     *
     * @return array
     */
    public function getTable($tableName);

    /**
     * Get all columns of the given table name.
     *
     * @param string $tableName
     * @param array $params
     *
     * @return array
     */
    public function getColumns($tableName, $params = null);

    /**
     * Get all the column names on the given table name
     *
     * @param $tableName
     *
     * @return array
     */
    public function getColumnsNames($tableName);

    /**
     * Check if the given table name has a given column name
     *
     * @param $tableName
     * @param $columnName
     *
     * @return bool
     */
    public function hasColumn($tableName, $columnName);

    /**
     * Get the info of the given column name in the given table name
     *
     * @param $tableName
     * @param $columnName
     *
     * @return array
     */
    public function getColumn($tableName, $columnName);

    /**
     * Check if the given table name has primary key column
     *
     * @param $tableName
     *
     * @return bool
     */
    public function hasPrimaryKey($tableName);

    /**
     * Get the primary key of the given table name.
     *
     * @param $tableName
     *
     * @return array
     */
    public function getPrimaryKey($tableName);

    /**
     * Get a list with all the tables and column structure and information.
     *
     * @return array
     */
    public function getFullSchema();

    /**
     * Get the UI options of the given column in the given table.
     *
     * @param $tableName
     * @param $columnName
     *
     * @return array
     */
    public function getUIOptions($tableName, $columnName);

    /**
     * Get
     *
     * @param $column
     *
     * @return string
     */
    public function getColumnUI($column);
}
