<?php

namespace Directus\Database\Schemas\Sources;

use Directus\Database\Connection;
use Directus\Database\Object\Column;
use Zend\Db\ResultSet\ResultSet;

interface SchemaInterface
{
    /**
     * Gets the schema source connection
     *
     * @return Connection
     */
    public function getConnection();

    /**
     * Get the schema name
     *
     * @return string
     */
    public function getSchemaName();

    /**
     * Gets a list of all tables structures.
     *
     * @param array $params
     *
     * @return ResultSet
     */
    public function getTables(array $params = []);

    /**
     * Gets a list of all tables name.
     *
     * @return ResultSet
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
     * Alias for hasTable
     *
     * @param $tableName
     *
     * @return bool
     */
    public function tableExists($tableName);

    /**
     * Checks whether one of the table in the list exists
     *
     * @param array $tablesName
     *
     * @return bool
     */
    public function someTableExists(array $tablesName);

    /**
     * Gets the structure of the given table name.
     *
     * @param $tableName
     *
     * @return ResultSet
     */
    public function getTable($tableName);

    /**
     * Gets all columns in the given table name.
     *
     * @param string $tableName
     * @param array $params
     *
     * @return ResultSet
     */
    public function getColumns($tableName, $params = null);

    /**
     * Gets all columns in the current schema
     *
     * @return ResultSet
     */
    public function getAllColumns();

    /**
     * Checks whether the given table name has a given column name
     *
     * @param $tableName
     * @param $columnName
     *
     * @return bool
     */
    public function hasColumn($tableName, $columnName);

    /**
     * Gets the info of the given column name in the given table name
     *
     * @param $tableName
     * @param $columnName
     *
     * @return array
     */
    public function getColumn($tableName, $columnName);

    /**
     * Checks whether the given table name has primary key column
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
     * Gets a list with all the tables and column structure and information.
     *
     * @return array
     */
    public function getFullSchema();

    /**
     * Gets the given column UI name
     *
     * @param $column
     *
     * @return string
     */
    public function getColumnUI($column);

    /**
     * Adds a primary key to the given column
     *
     * @param $table
     * @param $column
     *
     * @return bool
     */
    public function addPrimaryKey($table, $column);

    /**
     * Removes the primary key from the given column
     *
     * @param $table
     * @param $column
     *
     * @return bool
     */
    public function dropPrimaryKey($table, $column);

    /**
     * Cast record values by the schema type
     *
     * @param array $records
     * @param array $columns
     *
     * @return array
     */
    public function castRecordValues(array $records, $columns);

    /**
     * Cast value to its database type.
     *
     * @param mixed $data
     * @param null  $type
     *
     * @return mixed
     */
    public function castValue($data, $type = null);

    /**
     * Checks whether the given type is numeric type
     *
     * @param $type
     *
     * @return bool
     */
    public function isNumericType($type);

    /**
     * Gets the column type default interface name
     *
     * @param $type - Column type
     *
     * @return string
     */
    public function getColumnDefaultInterface($type);
}
