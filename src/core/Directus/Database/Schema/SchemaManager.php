<?php

namespace Directus\Database\Schema;

use Directus\Database\Exception\CollectionNotFoundException;
use Directus\Database\Schema\Object\Field;
use Directus\Database\Schema\Object\Collection;
use Directus\Database\Schema\Sources\MySQLSchema;
use Directus\Database\Schema\Sources\SchemaInterface;
use function Directus\is_valid_datetime;
use Directus\Util\ArrayUtils;
use Directus\Util\DateTimeUtils;

class SchemaManager
{
    // Tables
    const COLLECTION_ACTIVITY            = 'directus_activity';
    const COLLECTION_COLLECTIONS         = 'directus_collections';
    const COLLECTION_COLLECTION_PRESETS  = 'directus_collection_presets';
    const COLLECTION_FIELDS              = 'directus_fields';
    const COLLECTION_FILES               = 'directus_files';
    const COLLECTION_FOLDERS             = 'directus_folders';
    const COLLECTION_MIGRATIONS          = 'directus_migrations';
    const COLLECTION_ROLES               = 'directus_roles';
    const COLLECTION_PERMISSIONS         = 'directus_permissions';
    const COLLECTION_RELATIONS           = 'directus_relations';
    const COLLECTION_REVISIONS           = 'directus_revisions';
    const COLLECTION_SETTINGS            = 'directus_settings';
    const COLLECTION_USERS               = 'directus_users';
    const COLLECTION_WEBHOOKS            = 'directus_webhooks';
    const COLLECTION_USER_SESSIONS       = 'directus_user_sessions';

    /**
     * Schema source instance
     *
     * @var \Directus\Database\Schema\Sources\SchemaInterface
     */
    protected $source;

    /**
     * Schema data information
     *
     * @var array
     */
    protected $data = [];

    /**
     * System table prefix
     *
     * @var string
     */
    protected $prefix = 'directus_';

    /**
     * Directus System tables
     *
     * @var array
     */
    protected $directusTables = [
        // FIXME: Use constant value instead (one place)
        'activity',
        'activity_read',
        'collection_presets',
        'collections',
        'fields',
        'files',
        'folders',
        'migrations',
        'permissions',
        'relations',
        'revisions',
        'roles',
        'settings',
        'user_roles',
        'users'
    ];

     /**
     * Data types that don't require length. See https://dev.mysql.com/doc/refman/8.0/en/string-type-syntax.html
     * @var array
     */
    protected $noLengthDataTypes = [        
        'TEXT',
        'TINYTEXT',
        'MEDIUMTEXT',
        'LONGTEXT',
        'BLOB',
        'TINYBLOB',
        'MEDIUMBLOB',
        'LONGBLOB'
    ];

    public function __construct(SchemaInterface $source)
    {
        $this->source = $source;
    }

    /**
     * Adds a primary key to the given column
     *
     * @param $table
     * @param $column
     *
     * @return bool
     */
    public function addPrimaryKey($table, $column)
    {
        return $this->source->addPrimaryKey($table, $column);
    }

    /**
     * Removes the primary key of the given column
     *
     * @param $table
     * @param $column
     *
     * @return bool
     */
    public function dropPrimaryKey($table, $column)
    {
        return $this->source->dropPrimaryKey($table, $column);
    }

    /**
     * Get the table schema information
     *
     * @param string $tableName
     * @param array  $params
     * @param bool   $skipCache
     *
     * @throws CollectionNotFoundException
     *
     * @return \Directus\Database\Schema\Object\Collection
     */
    public function getCollection($collectionName, $params = [], $skipCache = false)
    {
        $collection = ArrayUtils::get($this->data, 'collections.' . $collectionName, null);
        if (!$collection || $skipCache) {
            // Get the table schema data from the source
            $collectionResult = $this->source->getCollection($collectionName);
            $collectionData = $collectionResult->current();

            if (!$collectionData) {
                throw new CollectionNotFoundException($collectionName);
            }

            // Create a table object based of the table schema data
            $collection = $this->createCollectionFromArray(array_merge($collectionData, [
                'schema' => $this->source->getSchemaName()
            ]));
            $this->addCollection($collectionName, $collection);
        }

        // =============================================================================
        // Set table columns
        // -----------------------------------------------------------------------------
        // @TODO: Do not allow to add duplicate column names
        // =============================================================================
        if (empty($collection->getFields())) {
            $fields = $this->getFields($collectionName, [], $skipCache);
            $collection->setFields($fields);
        }

        return $collection;
    }

    /**
     * Gets column schema
     *
     * @param $tableName
     * @param $columnName
     * @param bool $skipCache
     *
     * @return Field
     */
    public function getField($tableName, $columnName, $skipCache = false)
    {
        $columnSchema = ArrayUtils::get($this->data, 'fields.' . $tableName . '.' . $columnName, null);

        if (!$columnSchema || $skipCache) {
            // Get the column schema data from the source
            $columnData = $this->source->getField($tableName, $columnName);

            // Create a column object based of the table schema data
            $columnSchema = $this->createFieldFromArray($columnData);
            $this->addField($columnSchema);
        }

        return $columnSchema;
    }

    /**
     * Check if the given name is a system table
     *
     * @param $name
     *
     * @return bool
     */
    public function isSystemCollection($name)
    {
        return in_array($name, $this->getSystemCollections());
    }

    /**
     * Check if a collection exists
     *
     * @param string $collectionName
     *
     * @return bool
     */
    public function collectionExists($collectionName)
    {
        return $this->source->collectionExists($collectionName);
    }

    /**
     * Gets list of table
     *
     * @param array $params
     *
     * @return Collection[]
     */
    public function getCollections(array $params = [])
    {
        // TODO: Filter should be outsite
        // $schema = Bootstrap::get('schema');
        // $config = Bootstrap::get('config');

        // $ignoredTables = static::getDirectusTables(DirectusPreferencesTableGateway::$IGNORED_TABLES);
        // $blacklistedTable = $config['tableBlacklist'];
        // array_merge($ignoredTables, $blacklistedTable)
        $collections = $this->source->getCollections();

        $tables = [];
        foreach ($collections as $collection) {
            // Create a table object based of the table schema data
            $tableSchema = $this->createCollectionFromArray(array_merge($collection, [
                'schema' => $this->source->getSchemaName()
            ]));
            $tableName = $tableSchema->getName();
            $this->addCollection($tableName, $tableSchema);

            $tables[$tableName] = $tableSchema;
        }

        return $tables;
    }

    /**
     * Returns a list of all collections names
     *
     * @param array $params
     *
     * @return array
     */
    public function getCollectionsName(array $params = [])
    {
        $names = [];
        foreach ($this->getCollections($params) as $collection) {
            $names[] = $collection->getName();
        }

        return $names;
    }

    /**
     * Get all columns in the given table name
     *
     * @param $tableName
     * @param array $params
     * @param bool $skipCache
     *
     * @return \Directus\Database\Schema\Object\Field[]
     */
    public function getFields($tableName, $params = [], $skipCache = false)
    {
        // TODO: filter black listed fields on services level

        $columnsSchema = ArrayUtils::get($this->data, 'columns.' . $tableName, null);
        if (!$columnsSchema || $skipCache) {
            $columnsResult = $this->source->getFields($tableName, $params);

            $columnsSchema = [];
            foreach ($columnsResult as $column) {
                $columnsSchema[] = $this->createFieldFromArray($column);
            }

            $this->data['columns'][$tableName] = $this->addFieldsRelationship($tableName, $columnsSchema);
        }

        return $columnsSchema;
    }

    public function getFieldsName($tableName)
    {
        $columns = $this->getFields($tableName);

        $columnNames = [];
        foreach ($columns as $column) {
            $columnNames[] = $column->getName();
        }

        return $columnNames;
    }

    /**
     * Get all the columns
     *
     * @param array $params
     *
     * @return Field[]
     */
    public function getAllFields(array $params = [])
    {
        $allColumns = $this->source->getAllFields($params);

        $columns = [];
        foreach($allColumns as $column) {
            $columns[] = $this->createFieldFromArray($column);
        }

        return $columns;
    }

    /**
     * Get a list of columns table grouped by table name
     *
     * @return array
     */
    public function getAllFieldsByCollection()
    {
        $fields = [];
        foreach ($this->getAllFields() as $field) {
            $collectionName = $field->getCollectionName();
            if (!isset($fields[$collectionName])) {
                $fields[$collectionName] = [];
            }

            $columns[$collectionName][] = $field;
        }

        return $fields;
    }

    public function getPrimaryKey($tableName)
    {
        $collection = $this->getCollection($tableName);
        if ($collection) {
            return $collection->getPrimaryKeyName();
        }

        return false;
    }

    public function hasSystemDateField($tableName)
    {
        $tableObject = $this->getCollection($tableName);

        return $tableObject->getDateCreatedField() || $tableObject->getDateModifiedField();
    }

    public function castRecordValues($records, $columns)
    {
        return $this->source->castRecordValues($records, $columns);
    }

    /**
     * Cast value against a database type
     *
     * NOTE: it only works with MySQL data types
     *
     * @param $value
     * @param $type
     * @param $length
     *
     * @return mixed
     */
    public function castValue($value, $type = null, $length = false)
    {
        return $this->source->castValue($value, $type, $length);
    }

    /**
     * Checks whether the given type is numeric type
     *
     * @param $type
     *
     * @return bool
     */
    public function isNumericType($type)
    {
        return DataTypes::isNumericType($type);
    }

    /**
     * Checks whether the given type is string type
     *
     * @param $type
     *
     * @return bool
     */
    public function isStringType($type)
    {
        return DataTypes::isStringType($type);
    }

    /**
     * Checks whether the given type is integer type
     *
     * @param $type
     *
     * @return bool
     */
    public function isIntegerType($type)
    {
        return $this->source->isIntegerType($type);
    }

    /**
     * Checks whether the given type is decimal type
     *
     * @param $type
     *
     * @return bool
     */
    public function isFloatingPointType($type)
    {
        return $this->source->isFloatingPointType($type);
    }

    /**
     * Cast default value
     *
     * @param $value
     * @param $type
     * @param $length
     *
     * @return mixed
     */
    public function castDefaultValue($value, $type, $length = null)
    {
        if (strtolower($value) === 'null') {
            $value = null;
        } else {
            $value = $this->castValue($value, $type, $length);
        }

        return $value;
    }

    /**
     * Get the schema adapter
     *
     * @return SchemaInterface
     */
    public function getSchema()
    {
        return $this->source;
    }

    /**
     * List of supported databases
     *
     * @return array
     */
    public static function getSupportedDatabases()
    {
        return [
            'mysql' => [
                'id' => 'mysql',
                'name' => 'MySQL/Percona'
            ],
        ];
    }

    public static function getTemplates()
    {
        // @TODO: SchemaManager shouldn't be a class with static methods anymore
        // the UI templates list will be provided by a container or bootstrap.
        $path = implode(DIRECTORY_SEPARATOR, [
            \Directus\base_path(),
            'api',
            'migrations',
            'templates',
            '*'
        ]);

        $templatesDirs = glob($path, GLOB_ONLYDIR);
        $templatesData = [];
        foreach ($templatesDirs as $dir) {
            $key = basename($dir);
            $templatesData[$key] = [
                'id' => $key,
                'name' => \Directus\uc_convert($key)
            ];
        }

        return $templatesData;
    }

    /**
     * Returns all directus system collections name
     *
     * @return array
     */
    public static function getSystemCollections()
    {
        return [
            static::COLLECTION_ACTIVITY,
            static::COLLECTION_COLLECTIONS,
            static::COLLECTION_COLLECTION_PRESETS,
            static::COLLECTION_FIELDS,
            static::COLLECTION_FILES,
            static::COLLECTION_FOLDERS,
            static::COLLECTION_MIGRATIONS,
            static::COLLECTION_ROLES,
            static::COLLECTION_PERMISSIONS,
            static::COLLECTION_RELATIONS,
            static::COLLECTION_REVISIONS,
            static::COLLECTION_SETTINGS,
            static::COLLECTION_USERS,
            static::COLLECTION_WEBHOOKS,
            static::COLLECTION_USER_SESSIONS
        ];
    }

    /**
     * Gets a collection object from an array attributes data
     * @param $data
     *
     * @return Collection
     */
    public function createCollectionFromArray($data)
    {
        $data['hidden'] = (bool) ArrayUtils::get($data, 'hidden');
        $data['single'] = (bool) ArrayUtils::get($data, 'single');
        $data['managed'] = (bool) ArrayUtils::get($data, 'managed');

        return new Collection($data);
    }

    /**
     * Creates a column object from the given array
     *
     * @param array $column
     *
     * @return Field
     */
    public function createFieldFromArray($column)
    {
        $dataType = ArrayUtils::get($column, 'datatype');
        if (ArrayUtils::get($column, 'type') === null) {
            $column['type'] = $this->source->getTypeFromSource($dataType);
        }

        // PRIMARY KEY must be required
        if ($column['primary_key']) {
            $column['required'] = true;
        }

        $castAttributesToJSON = function (&$array, array $keys) {
            foreach ($keys as $key) {
                $value = json_decode(isset($array[$key]) ? $array[$key] : '', true);
                $array[$key] = $value ? $value : null;
            }
        };

        $castAttributesToJSON($column, ['options', 'translation']);

        $fieldType = ArrayUtils::get($column, 'type');
        // NOTE: Alias column must are nullable
        if (DataTypes::isAliasType($fieldType)) {
            $column['nullable'] = true;
        }        
                
        if ($this->isFloatingPointType($dataType)) {
            $column['length'] = sprintf('%d,%d', $column['precision'], $column['scale']);
        } else if ($this->source->isIntegerType($dataType)) {
            $column['length'] = $column['precision'];
        } else if (in_array($dataType, $this->noLengthDataTypes)) {
            $column['length'] = null;        
        } else {
            $column['length'] = $column['char_length'];
        }

        $castAttributesToBool = function (&$array, array $keys) {
            foreach ($keys as $key) {
                $array[$key] = (bool) ArrayUtils::get($array, $key);
            }
        };

        $castAttributesToBool($column, [
            'auto_increment',
            'unique',
            'managed',
            'primary_key',
            'signed',
            'hidden_detail',
            'hidden_browse',
            'required',
            'nullable',
            'readonly',
        ]);

        $this->setFieldDataDefaultValue($column);

        return new Field($column);
    }

    /**
     * @param string $collectionName
     * @param Field[] $fields
     *
     * @return array|Field[]
     */
    public function addFieldsRelationship($collectionName, array $fields)
    {
        $fieldsRelation = $this->getRelationshipsData($collectionName);

        if (count($fieldsRelation) > 0) {
            $fieldsByName = [];

            foreach ($fields as $field) {
                $fieldsByName[$field->getName()] = $field;
            }

            foreach ($fieldsRelation as $relation) {
                $fieldManyName = ArrayUtils::get($relation, 'field_many');
                $fieldOneName = ArrayUtils::get($relation, 'field_one');
                $fieldMany = $fieldManyName ? ArrayUtils::get($fieldsByName, $fieldManyName) : null;
                $fieldOne = $fieldOneName ? ArrayUtils::get($fieldsByName, $fieldOneName) : null;

                if ($fieldMany) {
                    $fieldMany->setRelationship($relation);
                }

                if ($fieldOne) {
                    $fieldOne->setRelationship($relation);
                }
            }
        }

        // At set the relationship to user and file type
        // "file" and "user" must be related to directus_files and directus_users
        foreach ($fields as $field) {
            $this->setSystemTypeRelationship($field);
        }

        return $fields;
    }

    /**
     * Sets System Field Type relationship
     *
     * @param Field $field
     */
    protected function setSystemTypeRelationship(Field $field)
    {
        if (DataTypes::isFilesType($field->getType())) {
            // Set all FILE data type related to directus files (M2O)
            $field->setRelationship([
                'collection_many' => $field->getCollectionName(),
                'field_many' => $field->getName(),
                'collection_one' => static::COLLECTION_FILES,
                'field_one' => 'id'
            ]);
        } else if (DataTypes::isUsersType($field->getType())) {
            $field->setRelationship([
                'collection_many' => $field->getCollectionName(),
                'field_many' => $field->getName(),
                'collection_one' => static::COLLECTION_USERS,
                'field_one' => 'id'
            ]);
        }
    }

    /**
     * @param array $field
     */
    protected function setFieldDataDefaultValue(array &$field)
    {
        // NOTE: MariaDB store "NULL" as a string on some data types such as VARCHAR.
        // We reserved the word "NULL" on nullable data type to be actually null
        if ($field['nullable'] === true && $field['default_value'] == 'NULL') {
            $field['default_value'] = null;
        }

        if ($field['default_value'] && (($this->source instanceof MySQLSchema) && $this->source->isMariaDb())) {
            if ($this->source->isStringType($field['datatype'])) {
                // When the field datatype is string we should only make sure to remove the first and last character
                // Those characters are the quote wrapping the default value
                // As a default string can have quotes as default (defined by the user) We should avoid to remove those
                $field['default_value'] = substr($field['default_value'], 1, -1);
            } else if ($this->source->isDateAndTimeTypes($field['datatype'])) {
                // All date types shouldn't have any quotes
                // Trim all quotes should be safe as the database doesn't support invalidate values
                // Unless it's a function such as `current_timestamp()` which again shouldn't have quotes
                $field['default_value'] = trim($field['default_value'], '\'');
            }
        }

        if (DataTypes::isDateTimeType($field['type']) && is_valid_datetime($field['default_value'], $this->source->getDateTimeFormat())) {
            $field['default_value'] = DateTimeUtils::createDateFromFormat($this->source->getDateTimeFormat(), $field['default_value'])->toISO8601Format();
        }
    }

    /**
     * @param string $collectionName
     *
     * @return array
     */
    protected function getRelationshipsData($collectionName)
    {
        $relationsResult = $this->source->getRelations($collectionName);
        $fieldsRelation = [];

        foreach ($relationsResult as $relation) {
            $fieldsRelation[] = $relation;
        }

        return $fieldsRelation;
    }

    /**
     * Checks whether the given type is a unique type
     *
     * @param $type
     *
     * @return bool
     */
    public function isUniqueFieldType($type)
    {
        return DataTypes::isUniqueType($type);
    }

    /**
     * Checks if a field is a numeric type
     *
     * @param Field $field
     *
     * @return bool
     */
    public function isFieldNumericType(Field $field)
    {
        if ($field->getType()) {
            return DataTypes::isNumericType($field->getType());
        }

        return $this->getSource()->isNumericType($field->getDataType());
    }

    /**
     * Checks if a field is a string type
     *
     * @param Field $field
     *
     * @return bool
     */
    public function isFieldStringType(Field $field)
    {
        if ($field->getType()) {
            return DataTypes::isStringType($field->getType());
        }

        return $this->getSource()->isStringType($field->getDataType());
    }

    /**
     * Checks if a given type requires length
     *
     * @param string $type
     *
     * @return mixed
     */
    public function isTypeLengthRequired($type)
    {
        return $this->getSource()->isTypeLengthRequired($type);
    }

    /**
     * Checks if a given type allows length
     *
     * @param string $type
     *
     * @return bool
     */
    public function isTypeLengthAllowed($type)
    {
        return $this->getSource()->isTypeLengthAllowed($type);
    }

    /**
     * Checks if the given type allows or requires length
     *
     * @param string $type
     *
     * @return bool
     */
    public function canTypeUseLength($type)
    {
        return $this->isTypeLengthRequired($type) || $this->isTypeLengthAllowed($type);
    }

    protected function addCollection($name, $schema)
    {
        // save the column into the data
        // @NOTE: this is the early implementation of cache
        // soon this will be change to cache
        $this->data['collections'][$name] = $schema;
    }

    protected function addField(Field $column)
    {
        $tableName = $column->getCollectionName();
        $columnName = $column->getName();
        $this->data['fields'][$tableName][$columnName] = $column;
    }

    /**
     *
     *
     * @param $type
     *
     * @return integer
     */
    public function getFieldDefaultLength($type)
    {
        return $this->source->getColumnDefaultLength($type);
    }

    /**
     * Gets the source schema adapter
     *
     * @return SchemaInterface
     */
    public function getSource()
    {
        return $this->source;
    }
}
