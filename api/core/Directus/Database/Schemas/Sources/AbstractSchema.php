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
    public function getColumnDefaultInterface($type)
    {
        $interfaceName = 'textinput';

        switch ($type) {
            case 'ALIAS':
                $interfaceName = 'alias';
                break;
            case 'MANYTOMANY':
            case 'ONETOMANY':
                $interfaceName = 'relational';
                break;
            case 'TINYINT':
                $interfaceName = 'checkbox';
                break;
            case 'MEDIUMBLOB':
            case 'BLOB':
                $interfaceName = 'blob';
                break;
            case 'TEXT':
            case 'LONGTEXT':
                $interfaceName = 'textarea';
                break;
            case 'CHAR':
            case 'VARCHAR':
            case 'POINT':
                $interfaceName = 'textinput';
                break;
            case 'DATETIME':
            case 'TIMESTAMP':
                $interfaceName = 'datetime';
                break;
            case 'DATE':
                $interfaceName = 'date';
                break;
            case 'TIME':
                $interfaceName = 'time';
                break;
            case 'YEAR':
            case 'INT':
            case 'BIGINT':
            case 'SMALLINT':
            case 'MEDIUMINT':
            case 'FLOAT':
            case 'DOUBLE':
            case 'DECIMAL':
                $interfaceName = 'numeric';
                break;
        }

        return $interfaceName;
    }

    /**
     * @inheritdoc
     */
    public function isType($type, array $list)
    {
        return in_array(strtolower($type), $list);
    }
}
