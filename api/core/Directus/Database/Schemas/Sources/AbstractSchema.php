<?php

namespace Directus\Database\Schemas\Sources;

use Directus\Database\Object\Column;
use Directus\Util\ArrayUtils;

abstract class AbstractSchema implements SchemaInterface
{
    /**
     * Database connection adapter
     *
     * @var \Zend\DB\Adapter\Adapter
     */
    protected $adapter;

    /**
     * Schema information
     *
     * @var array
     */
    protected $schema;

    /**
     * AbstractSchema constructor.
     *
     * @param $adapter
     */
    public function __construct($adapter)
    {
        $this->adapter = $adapter;
    }

    public function getConnection()
    {
        return $this->adapter;
    }

    /**
     * Get the schema name
     *
     * @return string
     */
    public function getSchemaName()
    {
        return $this->adapter->getCurrentSchema();
    }

    /**
     * Cast records values by its column data type
     *
     * @param array    $records
     * @param Column[] $columns
     *
     * @return array
     */
    public function castRecordValues(array $records, $columns)
    {
        // hotfix: records sometimes are no set as an array of rows.
        $singleRecord = false;
        if (!ArrayUtils::isNumericKeys($records)) {
            $records = [$records];
            $singleRecord = true;
        }

        foreach ($columns as $column) {
            foreach ($records as $index => $record) {
                $columnName = $column->getName();
                if (ArrayUtils::has($record, $columnName)) {
                    $records[$index][$columnName] = $this->castValue($record[$columnName], $column->getType());
                }
            }
        }

        return $singleRecord ? reset($records) : $records;
    }

    /**
     * Parse records value by its column data type
     *
     * @see AbastractSchema::castRecordValues
     *
     * @param array $records
     * @param $columns
     *
     * @return array
     */
    public function parseRecordValuesByType(array $records, $columns)
    {
        return $this->castRecordValues($records, $columns);
    }

    /**
     * @inheritdoc
     */
    public function getColumnDefaultUI($columnType)
    {
        switch ($columnType) {
            case 'ALIAS':
                return 'alias';
            case 'MANYTOMANY':
            case 'ONETOMANY':
                return 'relational';
            case 'TINYINT':
                return 'checkbox';
            case 'MEDIUMBLOB':
            case 'BLOB':
                return 'blob';
            case 'TEXT':
            case 'LONGTEXT':
                return 'textarea';
            case 'CHAR':
            case 'VARCHAR':
            case 'POINT':
                return 'textinput';
            case 'DATETIME':
            case 'TIMESTAMP':
                return 'datetime';
            case 'DATE':
                return 'date';
            case 'TIME':
                return 'time';
            case 'YEAR':
            case 'INT':
            case 'BIGINT':
            case 'SMALLINT':
            case 'MEDIUMINT':
            case 'FLOAT':
            case 'DOUBLE':
            case 'DECIMAL':
                return 'numeric';
        }

        return 'textinput';
    }
}
