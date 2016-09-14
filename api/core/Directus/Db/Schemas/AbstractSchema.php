<?php

namespace Directus\Db\Schemas;

use Directus\Database\Object\Column;

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
        if (!is_numeric_keys_array($records)) {
            $records = [$records];
            $singleRecord = true;
        }

        foreach ($columns as $column) {
            foreach ($records as $index => $record) {
                $col = $column->getId();
                if (array_key_exists($col, $record)) {
                    $records[$index][$col] = $this->parseType($record[$col], $column->getType());
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
}
