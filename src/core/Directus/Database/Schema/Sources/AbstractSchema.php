<?php

namespace Directus\Database\Schema\Sources;

use Directus\Database\Schema\DataTypes;
use Directus\Database\Schema\Object\Field;
use Directus\Util\ArrayUtils;

abstract class AbstractSchema implements SchemaInterface
{
    /**
     * @var string
     */
    protected $datetimeFormat = 'Y-m-d H:i:s';

    /**
     * Cast records values by its column data type
     *
     * @param array    $records
     * @param Field[] $fields
     *
     * @return array
     */
    public function castRecordValues(array $records, $fields)
    {
        // hotfix: records sometimes are no set as an array of rows.
        $singleRecord = false;
        if (!ArrayUtils::isNumericKeys($records)) {
            $records = [$records];
            $singleRecord = true;
        }

        foreach ($fields as $field) {
            foreach ($records as $index => $record) {
                $fieldName = $field->getName();
                if (ArrayUtils::has($record, $fieldName)) {
                    $type = $field->getDataType();

                    $records[$index][$fieldName] = $this->castValue($record[$fieldName], $type);
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
    public function getDefaultLengths()
    {
        return [
            // 'ALIAS' => static::INTERFACE_ALIAS,
            // 'MANYTOMANY' => static::INTERFACE_ALIAS,
            // 'ONETOMANY' => static::INTERFACE_ALIAS,

            // 'BIT' => static::INTERFACE_TOGGLE,
            // 'TINYINT' => static::INTERFACE_TOGGLE,

            // 'MEDIUMBLOB' => static::INTERFACE_BLOB,
            // 'BLOB' => static::INTERFACE_BLOB,

            // 'TINYTEXT' => static::INTERFACE_TEXT_AREA,
            // 'TEXT' => static::INTERFACE_TEXT_AREA,
            // 'MEDIUMTEXT' => static::INTERFACE_TEXT_AREA,
            // 'LONGTEXT' => static::INTERFACE_TEXT_AREA,

            'CHAR' => 1,
            'VARCHAR' => 255,
            // 'POINT' => static::INTERFACE_TEXT_INPUT,

            // 'DATETIME' => static::INTERFACE_DATETIME,
            // 'TIMESTAMP' => static::INTERFACE_DATETIME,

            // 'DATE' => static::INTERFACE_DATE,

            // 'TIME' => static::INTERFACE_TIME,

            // 'YEAR' => static::INTERFACE_NUMERIC,
            // 'SMALLINT' => static::INTERFACE_NUMERIC,
            // 'MEDIUMINT' => static::INTERFACE_NUMERIC,
            'INT' => 11,
            'INTEGER' => 11,
            // 'BIGINT' => static::INTERFACE_NUMERIC,
            // 'FLOAT' => static::INTERFACE_NUMERIC,
            // 'DOUBLE' => static::INTERFACE_NUMERIC,
            // 'DECIMAL' => static::INTERFACE_NUMERIC,
        ];
    }

    /**
     * @inheritdoc
     */
    public function getColumnDefaultLength($type)
    {
        return ArrayUtils::get($this->getDefaultLengths(), strtoupper($type), null);
    }

    /**
     * @inheritdoc
     */
    public function isType($type, array $list)
    {
        return in_array(strtolower($type), $list);
    }

    /**
     * @inheritdoc
     */
    public function getTypeFromSource($sourceType)
    {
        $type = null;

        switch (strtolower($sourceType)) {
            case 'tinyint':
            case 'smallint':
            case 'mediumint':
            case 'bigint':
            case 'serial':
            case 'int': // alias: integer
            case 'year':
                $type = DataTypes::TYPE_INTEGER;
                break;
            case 'decimal': // alias: dec, fixed
            case 'numeric':
            case 'real':
            case 'float': // alias: real
            case 'double': // alias: double precision, real
                $type = DataTypes::TYPE_DECIMAL;
                break;
            case 'bool':
            case 'boolean':
                $type = DataTypes::TYPE_BOOLEAN;
            case 'blob':
            case 'longblob':
            case 'bit':
            case 'binary':
            case 'varbinary':
                $type = DataTypes::TYPE_BINARY;
                break;
            case 'datetime':
            case 'timestamp':
                $type = DataTypes::TYPE_DATETIME;
                break;
            case 'date':
                $type = DataTypes::TYPE_DATE;
                break;
            case 'time':
                $type = DataTypes::TYPE_TIME;
                break;
            case 'char':
            case 'varchar':
            case 'enum':
            case 'set':
            case 'tinytext':
            case 'text':
            case 'mediumtext':
            case 'longtext':
                $type = DataTypes::TYPE_STRING;
                break;
            case 'json':
                $type = DataTypes::TYPE_JSON;
                break;
        }

        return $type;
    }

    /**
     * @inheritdoc
     */
    public function getDateTimeFormat()
    {
        return $this->datetimeFormat;
    }
}
