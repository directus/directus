<?php

namespace Directus\Database\Schemas\Sources;

use Directus\Database\Connection;
use Zend\Db\ResultSet\ResultSet;

interface SchemaInterface
{
    /**
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
     * Get a list of all tables structures.
     *
     * @param array $params
     *
     * @return array
     */
    public function getTables(array $params = []);

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
     * @return bool
     */
    public function hasTable($tableName);

    /**
     * Alias for hasTable
     *
     * @param $tableName
     * @return bool
     */
    public function tableExists($tableName);

    /**
     * Check if one of the table in the list exists
     *
     * @param array $tablesName
     * @return bool
     */
    public function someTableExists(array $tablesName);

    /**
     * Get the structure of the given table name.
     *
     * @param $tableName
     * @return array
     */
    public function getTable($tableName);

    /**
     * Get all columns of the given table name.
     *
     * @param string $tableName
     * @param array $params
     *
     * @return ResultSet
     */
    public function getColumns($tableName, $params = null);

    /**
     * Get all columns of the current schema
     *
     * @return ResultSet
     */
    public function getAllColumns();

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
     * Get the column UI
     *
     * @param $column
     *
     * @return string
     */
    public function getColumnUI($column);

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

    // TODO: remove parseRecordValuesByType and ParseType
    /**
     * Cast record values by the schema type
     *
     * @see SschemaInterface::castRecordValues
     *
     * @param array $records
     * @param array $columns
     *
     * @return array
     */
    public function parseRecordValuesByType(array $records, $columns);

    /**
     * Cast value to its database type.
     *
     * @see SchemaInterface::castValue
     *
     * @param mixed $data
     * @param null  $type
     *
     * @return mixed
     */
    public function parseType($data, $type = null);
}
