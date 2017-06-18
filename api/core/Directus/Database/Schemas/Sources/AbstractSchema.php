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
    public function getDefaultInterfaces()
    {
        return [
            'ALIAS' => static::INTERFACE_ALIAS,
            'MANYTOMANY' => static::INTERFACE_ALIAS,
            'ONETOMANY' => static::INTERFACE_ALIAS,

            'BIT' => static::INTERFACE_TOGGLE,
            'TINYINT' => static::INTERFACE_TOGGLE,

            'MEDIUMBLOB' => static::INTERFACE_BLOB,
            'BLOB' => static::INTERFACE_BLOB,

            'TINYTEXT' => static::INTERFACE_TEXT_AREA,
            'TEXT' => static::INTERFACE_TEXT_AREA,
            'MEDIUMTEXT' => static::INTERFACE_TEXT_AREA,
            'LONGTEXT' => static::INTERFACE_TEXT_AREA,

            'CHAR' => static::INTERFACE_TEXT_INPUT,
            'VARCHAR' => static::INTERFACE_TEXT_INPUT,
            'POINT' => static::INTERFACE_TEXT_INPUT,

            'DATETIME' => static::INTERFACE_DATETIME,
            'TIMESTAMP' => static::INTERFACE_DATETIME,

            'DATE' => static::INTERFACE_DATE,

            'TIME' => static::INTERFACE_TIME,

            'YEAR' => static::INTERFACE_NUMERIC,
            'SMALLINT' => static::INTERFACE_NUMERIC,
            'MEDIUMINT' => static::INTERFACE_NUMERIC,
            'INT' => static::INTERFACE_NUMERIC,
            'INTEGER' => static::INTERFACE_NUMERIC,
            'BIGINT' => static::INTERFACE_NUMERIC,
            'FLOAT' => static::INTERFACE_NUMERIC,
            'DOUBLE' => static::INTERFACE_NUMERIC,
            'DECIMAL' => static::INTERFACE_NUMERIC,
        ];
    }

    /**
     * @inheritdoc
     */
    public function getColumnDefaultInterface($type)
    {
        return ArrayUtils::get($this->getDefaultInterfaces(), strtoupper($type), static::INTERFACE_TEXT_INPUT);
    }

    /**
     * @inheritdoc
     */
    public function isType($type, array $list)
    {
        return in_array(strtolower($type), $list);
    }
}
