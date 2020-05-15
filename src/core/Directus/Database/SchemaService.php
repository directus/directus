<?php

namespace Directus\Database;

use Directus\Application\Application;
use Directus\Config\Config;
use Directus\Database\Exception\FieldNotFoundException;
use Directus\Database\Schema\Object\Field;
use Directus\Database\Schema\Object\Collection;
use Directus\Database\Schema\Object\FieldRelationship;
use Directus\Database\Schema\SchemaManager;

class SchemaService
{
    /**
     * Schema Manager Instance
     *
     * @var SchemaManager
     */
    protected static $schemaManager = null;

    /**
     * ACL Instance
     *
     * @var \Directus\Permissions\Acl null
     */
    protected static $acl = null;

    /**
     * Connection instance
     *
     * @var \Directus\Database\Connection|null
     */
    protected static $connection = null;

    /**
     * @var Config
     */
    protected static $config = [];

    // These columns types are aliases for "associations". They don't have
    // real, corresponding columns in the DB.
    public static $association_types = ['ONETOMANY', 'MANYTOMANY', 'ALIAS'];

    protected $table;
    protected $db;
    protected $_loadedSchema;
    protected static $_schemas = [];
    protected static $_primaryKeys = [];

    /**
     * Get the schema manager instance
     *
     * @return SchemaManager
     */
    public static function getSchemaManagerInstance()
    {
        if (static::$schemaManager === null) {
            static::setSchemaManagerInstance(
                Application::getInstance()->fromContainer('schema_manager')
            );
        }

        return static::$schemaManager;
    }

    /**
     * Set the Schema Manager instance
     *
     * @param $schemaManager
     */
    public static function setSchemaManagerInstance($schemaManager)
    {
        static::$schemaManager = $schemaManager;
    }

    /**
     * Get ACL Instance
     *
     * @return \Directus\Permissions\Acl
     */
    public static function getAclInstance()
    {
        if (static::$acl === null) {
            static::setAclInstance(
                Application::getInstance()->fromContainer('acl')
            );
        }

        return static::$acl;
    }


    /**
     * Set ACL Instance
     * @param $acl
     */
    public static function setAclInstance($acl)
    {
        static::$acl = $acl;
    }

    /**
     * Get Connection Instance
     *
     * @return \Directus\Database\Connection
     */
    public static function getConnectionInstance()
    {
        if (static::$connection === null) {
            static::setConnectionInstance(
                Application::getInstance()->fromContainer('schema_manager')
            );
        }

        return static::$connection;
    }

    public static function setConnectionInstance($connection)
    {
        static::$connection = $connection;
    }

    public static function setConfig($config)
    {
        static::$config = $config;
    }

    /**
     * Gets table schema object
     *
     * @param $tableName
     * @param array $params
     * @param bool $skipCache
     * @param bool $skipAcl
     *
     * @return Collection
     */
    public static function getCollection($tableName, array $params = [], $skipCache = false, $skipAcl = false)
    {
        // if (!$skipAcl) {
            // static::getAclInstance()->enforceRead($tableName);
        // }

        return static::getSchemaManagerInstance()->getCollection($tableName, $params, $skipCache);
    }

    public static function getCollectionOwnerField($collection)
    {
        $collectionObject = static::getCollection($collection);

        return $collectionObject->getUserCreatedField();
    }

    public static function getCollectionOwnerFieldName($collection)
    {
        $field = static::getCollectionOwnerField($collection);

        return $field ? $field->getName() : null;
    }

    /**
     * Gets table columns schema
     *
     * @param string $tableName
     * @param array $params
     * @param bool $skipCache
     *
     * @return Field[]
     */
    public static function getFields($tableName, array $params = [], $skipCache = false)
    {
        $tableObject = static::getCollection($tableName, $params, $skipCache);

        return array_values(array_filter($tableObject->getFields(), function (Field $column) {
            return static::canReadField($column->getCollectionName(), $column->getName());
        }));
    }

    /**
     * Gets the column object
     *
     * @param string $tableName
     * @param string $columnName
     * @param bool $skipCache
     * @param bool $skipAcl
     *
     * @return Field
     */
    public static function getField($tableName, $columnName, $skipCache = false, $skipAcl = false)
    {
        // Due to a problem the way we use to cache using array
        // if a column information is fetched before its table
        // the table is going to be created with only one column
        // to prevent this we always get the table even if we only want one column
        // Stop using getColumnSchema($tableName, $columnName); until we fix this.
        $tableObject = static::getCollection($tableName, [], $skipCache, $skipAcl);
        $column = $tableObject->getField($columnName);

        return $column;
    }

    /**
     * @todo  for ALTER requests, caching schemas can't be allowed
     */

    /**
     * Checks whether the given table has a status column
     *
     * @param $tableName
     * @param $skipAcl
     *
     * @return bool
     */
    public static function hasStatusField($tableName, $skipAcl = false)
    {
        $schema = static::getCollection($tableName, [], false, $skipAcl);

        return $schema->hasStatusField();
    }

    /**
     * Gets the status field
     *
     * @param $tableName
     * @param $skipAcl
     *
     * @return null|Field
     */
    public static function getStatusField($tableName, $skipAcl = false)
    {
        $schema = static::getCollection($tableName, [], false, $skipAcl);

        return $schema->getStatusField();
    }

    /**
     * Gets the status field name
     *
     * @param $collectionName
     * @param bool $skipAcl
     *
     * @return null|string
     */
    public static function getStatusFieldName($collectionName, $skipAcl = false)
    {
        $field = static::getStatusField($collectionName, $skipAcl);
        $name = null;

        if ($field) {
            $name = $field->getName();
        }

        return $name;
    }

    /**
     * If the table has one or more relational interfaces
     *
     * @param $tableName
     * @param array $columns
     * @param bool $skipAcl
     *
     * @return bool
     */
    public static function hasSomeRelational($tableName, array $columns, $skipAcl = false)
    {
        $tableSchema = static::getCollection($tableName, [], false, $skipAcl);
        $relationalColumns = $tableSchema->getRelationalFieldsName();

        $has = false;
        foreach ($relationalColumns as $column) {
            if (in_array($column, $columns)) {
                $has = true;
                break;
            }
        }

        return $has;
    }

    /**
     * Gets tehe column relationship type
     *
     * @param $tableName
     * @param $columnName
     *
     * @return null|string
     */
    public static function getColumnRelationshipType($tableName, $columnName)
    {
        $relationship = static::getColumnRelationship($tableName, $columnName);

        $relationshipType = null;
        if ($relationship) {
            $relationshipType = $relationship->getType();
        }

        return $relationshipType;
    }

    /**
     * Gets Column's relationship
     *
     * @param $tableName
     * @param $columnName
     *
     * @return FieldRelationship|null
     */
    public static function getColumnRelationship($tableName, $columnName)
    {
        $column = static::getField($tableName, $columnName);

        return $column && $column->hasRelationship() ? $column->getRelationship() : null;
    }

    /**
     * Check whether the given table-column has relationship
     *
     * @param $tableName
     * @param $columnName
     *
     * @return bool
     *
     * @throws FieldNotFoundException
     */
    public static function hasRelationship($tableName, $columnName)
    {
        $tableObject = static::getCollection($tableName);
        $columnObject = $tableObject->getField($columnName);

        if (!$columnObject) {
            throw new FieldNotFoundException($columnName);
        }

        return $columnObject->hasRelationship();
    }

    /**
     * Gets related table name
     *
     * @param $tableName
     * @param $columnName
     *
     * @return string
     */
    public static function getRelatedCollectionName($tableName, $columnName)
    {
        if (!static::hasRelationship($tableName, $columnName)) {
            return null;
        }

        $tableObject = static::getCollection($tableName);
        $columnObject = $tableObject->getField($columnName);
        if($columnObject->getRelationship()->getType() == FieldRelationship::ONE_TO_MANY)
            return $columnObject->getRelationship()->getCollectionMany();
        else
            return $columnObject->getRelationship()->getCollectionOne();
    }

    /**
     * Checks whether the table is a system table
     *
     * @param $tableName
     *
     * @return bool
     */
    public static function isSystemCollection($tableName)
    {
        return static::getSchemaManagerInstance()->isSystemCollection($tableName);
    }

    /**
     * @param $tableName
     *
     * @return \Directus\Database\Schema\Object\Field[] |bool
     */
    public static function getAllCollectionFields($tableName)
    {
        $columns = static::getSchemaManagerInstance()->getFields($tableName);

        $acl = static::getAclInstance();
        $readFieldBlacklist = $acl->getReadFieldBlacklist($tableName);

        return array_filter($columns, function (Field $column) use ($readFieldBlacklist) {
            return !in_array($column->getName(), $readFieldBlacklist);
        });
    }

    /**
     * @param $tableName
     *
     * @return array
     */
    public static function getAllCollectionFieldsName($tableName)
    {
        // @TODO: make all these methods name more standard
        // TableColumnsName vs TableColumnNames
        $fields = static::getAllCollectionFields($tableName);

        return array_map(function(Field $field) {
            return $field->getName();
        }, $fields);
    }

    public static function getAllNonAliasCollectionFieldNames($table)
    {
        $columnNames = [];
        $columns = self::getAllNonAliasCollectionFields($table);
        if (false === $columns) {
            return false;
        }

        foreach ($columns as $column) {
            $columnNames[] = $column->getName();
        }

        return $columnNames;
    }

    /**
     * Gets the non alias columns from the given table name
     *
     * @param string $tableName
     * @param bool $onlyNames
     *
     * @return Field[]|bool
     */
    public static function getAllNonAliasCollectionFields($tableName, $onlyNames = false)
    {
        $columns = [];
        $schemaArray = static::getAllCollectionFields($tableName);
        if (false === $schemaArray) {
            return false;
        }
        foreach ($schemaArray as $column) {
            if (!$column->isAlias()) {
                $columns[] = $onlyNames === true ? $column->getName() : $column;
            }
        }

        return $columns;
    }

    /**
     * Gets the alias columns from the given table name
     *
     * @param string $tableName
     * @param bool $onlyNames
     *
     * @return Field[]|bool
     */
    public static function getAllAliasCollectionFields($tableName, $onlyNames = false)
    {
        $columns = [];
        $schemaArray = static::getAllCollectionFields($tableName);
        if (false === $schemaArray) {
            return false;
        }

        foreach ($schemaArray as $column) {
            if ($column->isAlias()) {
                $columns[] = $onlyNames === true ? $column->getName() : $column;
            }
        }

        return $columns;
    }

    /**
     * Gets the non alias columns name from the given table name
     *
     * @param string $tableName
     *
     * @return Field[]|bool
     */
    public static function getAllNonAliasCollectionFieldsName($tableName)
    {
        return static::getAllNonAliasCollectionFields($tableName, true);
    }

    /**
     * Gets the alias columns name from the given table name
     *
     * @param string $tableName
     *
     * @return Field[]|bool
     */
    public static function getAllAliasCollectionFieldsName($tableName)
    {
        return static::getAllAliasCollectionFields($tableName, true);
    }

    public static function getCollectionFields($table, $limit = null, $skipIgnore = false)
    {
        if (!self::canGroupReadCollection($table)) {
            return [];
        }

        $schemaManager = static::getSchemaManagerInstance();
        $tableObject = $schemaManager->getCollection($table);
        $columns = $tableObject->getFields();
        $columnsName = [];
        $count = 0;
        foreach ($columns as $column) {
            if ($skipIgnore === false
                && (
                    ($tableObject->hasStatusField() && $column->getName() === $tableObject->getStatusField()->getName())
                    || ($tableObject->hasSortingField() && $column->getName() === $tableObject->getSortingField())
                    || ($tableObject->hasPrimaryField() && $column->getName() === $tableObject->getPrimaryField())
                )
            ) {
                continue;
            }

            // at least will return one
            if ($limit && $count > $limit) {
                break;
            }

            $columnsName[] = $column->getName();
            $count++;
        }

        return $columnsName;
    }

    public static function getFieldsName($table)
    {
        if (isset(static::$_schemas[$table])) {
            $columns = array_map(function($column) {
                return $column['column_name'];
            }, static::$_schemas[$table]);
        } else {
            $columns = static::getSchemaManagerInstance()->getFieldsName($table);
        }

        $names = [];
        foreach ($columns as $column) {
            $names[] = $column;
        }

        return $names;
    }

    /**
     * Checks whether or not the given table has a sort column
     *
     * @param $table
     * @param bool $includeAlias
     *
     * @return bool
     */
    public static function hasCollectionSortField($table, $includeAlias = false)
    {
        $column = static::getCollectionSortField($table);

        return static::hasCollectionField($table, $column, $includeAlias);
    }

    public static function hasCollectionField($table, $column, $includeAlias = false, $skipAcl = false)
    {
        $tableObject = static::getCollection($table, [], false, $skipAcl);

        $columns = $tableObject->getNonAliasFieldsName();
        if ($includeAlias) {
            $columns = array_merge($columns, $tableObject->getAliasFieldsName());
        }

        if (in_array($column, $columns)) {
            return true;
        }

        return false;
    }

    /**
     * Gets the table sort column name
     *
     * @param $table
     *
     * @return string
     */
    public static function getCollectionSortField($table)
    {
        $tableObject = static::getCollection($table);

        $sortColumnName = $tableObject->getSortingField();
        if (!$sortColumnName) {
            $sortColumnName = $tableObject->getPrimaryKeyName() ?: 'id';
        }

        return $sortColumnName;
    }

    /**
     * Has the authenticated user permission to view the given table
     *
     * @param $tableName
     *
     * @return bool
     */
    public static function canGroupReadCollection($tableName)
    {
        $acl = static::getAclInstance();

        if (! $acl) {
            return true;
        }

        return $acl->canRead($tableName);
    }

    /**
     * Has the authenticated user permissions to read the given column
     *
     * @param $tableName
     * @param $columnName
     *
     * @return bool
     */
    public static function canReadField($tableName, $columnName)
    {
        $acl = static::getAclInstance();

        if (! $acl) {
            return true;
        }

        return $acl->canReadField($tableName, $columnName);
    }

    /**
     * Get table primary key
     * @param $tableName
     * @return String|boolean - column name or false
     */
    public static function getCollectionPrimaryKey($tableName)
    {
        if (isset(self::$_primaryKeys[$tableName])) {
            return self::$_primaryKeys[$tableName];
        }

        $schemaManager = static::getSchemaManagerInstance();

        $columnName = $schemaManager->getPrimaryKey($tableName);

        return self::$_primaryKeys[$tableName] = $columnName;
    }

    protected static function createParamArray($values, $prefix)
    {
        $result = [];

        foreach ($values as $i => $field) {
            $result[$prefix . $i] = $field;
        }

        return $result;
    }
}
