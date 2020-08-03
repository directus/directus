<?php

namespace Directus\Database\TableGateway;

use Directus\Config\StatusMapping;
use Directus\Container\Container;
use Directus\Database\Exception\CollectionHasNotStatusInterfaceException;
use Directus\Database\Exception\DuplicateItemException;
use Directus\Database\Exception\InvalidQueryException;
use Directus\Database\Exception\ItemNotFoundException;
use Directus\Database\Exception\StatusMappingEmptyException;
use Directus\Database\Exception\StatusMappingWrongValueTypeException;
use Directus\Database\Exception\SuppliedArrayAsColumnValue;
use Directus\Database\Query\Builder;
use Directus\Database\Schema\DataTypes;
use Directus\Database\Schema\Object\Collection;
use Directus\Database\RowGateway\BaseRowGateway;
use Directus\Database\Schema\Object\Field;
use Directus\Database\Schema\SchemaManager;
use Directus\Database\TableGatewayFactory;
use Directus\Database\SchemaService;
use Directus\Exception\Exception;
use Directus\Exception\UnprocessableEntityException;
use function Directus\filename_put_ext;
use Directus\Filesystem\Files;
use function Directus\get_directus_setting;
use Directus\Hook\Emitter;
use Directus\Permissions\Acl;
use Directus\Permissions\Exception\ForbiddenCollectionDeleteException;
use Directus\Permissions\Exception\ForbiddenCollectionReadException;
use Directus\Permissions\Exception\ForbiddenCollectionUpdateException;
use Directus\Permissions\Exception\UnableFindOwnerItemsException;
use Directus\Util\ArrayUtils;
use Directus\Util\DateTimeUtils;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Exception\UnexpectedValueException;
use Zend\Db\ResultSet\ResultSet;
use Zend\Db\ResultSet\ResultSetInterface;
use Zend\Db\Sql\Ddl;
use Zend\Db\Sql\Delete;
use Zend\Db\Sql\Insert;
use Zend\Db\Sql\Predicate\In;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\SqlInterface;
use Zend\Db\Sql\Update;
use Zend\Db\TableGateway\Feature;
use Zend\Db\TableGateway\Feature\RowGatewayFeature;
use Zend\Db\TableGateway\TableGateway;
use function Directus\get_random_string;

class BaseTableGateway extends TableGateway
{
    public $primaryKeyFieldName = null;

    public $memcache;

    /**
     * @var array
     */
    protected $options = [];

    /**
     * Hook Emitter Instance
     *
     * @var \Directus\Hook\Emitter
     */
    protected static $emitter = null;

    /**
     * @var Container
     */
    protected static $container;

    /**
     * Acl Instance
     *
     * @var Acl|null
     */
    protected $acl = null;

    /**
     * Schema Manager Instance
     *
     * @var SchemaManager|null
     */
    protected $schemaManager = null;

    /**
     * Table Schema Object
     *
     * @var Collection|null
     */
    protected $tableSchema = null;

    /**
     * Name of the field flag that mark a record as hard-delete
     *
     * Note: temporary is being hold by the base table gateway
     *
     * @var string
     */
    protected $deleteFlag = '$delete';

    /**
     * Constructor
     *
     * @param string $table
     * @param AdapterInterface $adapter
     * @param Acl|null $acl
     * @param Feature\AbstractFeature|Feature\FeatureSet|Feature\AbstractFeature[] $features
     * @param ResultSetInterface $resultSetPrototype
     * @param Sql $sql
     * @param string $primaryKeyName
     *
     * @throws \InvalidArgumentException
     */
    public function __construct($table, AdapterInterface $adapter, $acl = null, $features = null, ResultSetInterface $resultSetPrototype = null, Sql $sql = null, $primaryKeyName = null)
    {
        // Add table name reference here, so we can fetch the table schema object
        $this->table = $table;
        $this->acl = $acl;

        // @NOTE: temporary, do we need it here?
        if ($this->primaryKeyFieldName === null) {
            if ($primaryKeyName !== null) {
                $this->primaryKeyFieldName = $primaryKeyName;
            } else {
                $tableObject = $this->getTableSchema();
                if ($tableObject->getPrimaryField()) {
                    $this->primaryKeyFieldName = $tableObject->getPrimaryField()->getName();
                }
            }
        }

        // @NOTE: This will be substituted by a new Cache wrapper class
        // $this->memcache = new MemcacheProvider();
        if ($features === null) {
            $features = new Feature\FeatureSet();
        } else if ($features instanceof Feature\AbstractFeature) {
            $features = [$features];
        } else if (is_array($features)) {
            $features = new Feature\FeatureSet($features);
        }

        // NOTE: This is a hotfix to prevent add a rowgateway feature when there's not primaryKeyFieldName set
        // BaseRowGateway requires a primary key to works
        if ($this->primaryKeyFieldName) {
            $rowGatewayPrototype = new BaseRowGateway($this->primaryKeyFieldName, $table, $adapter, $this->acl);
            $rowGatewayFeature = new RowGatewayFeature($rowGatewayPrototype);
            $features->addFeature($rowGatewayFeature);
        }

        parent::__construct($table, $adapter, $features, $resultSetPrototype, $sql);

        if (static::$container) {
            $this->schemaManager = static::$container->get('schema_manager');
        }
    }

    /**
     * Static Factory Methods
     */

    /**
     * Creates a table gateway based on a table's name
     *
     * Underscore to camelcase table name to namespaced table gateway classname,
     * e.g. directus_users => \Directus\Database\TableGateway\DirectusUsersTableGateway
     *
     * @param string $table
     * @param AdapterInterface $adapter
     * @param null $acl
     *
     * @return RelationalTableGateway
     */
    public static function makeTableGatewayFromTableName($table, $adapter, $acl = null)
    {
        return TableGatewayFactory::create($table, [
            'adapter' => $adapter,
            'acl' => $acl
        ]);
    }

    /**
     * Make a new table gateway
     *
     * @param string $tableName
     * @param AdapterInterface $adapter
     * @param Acl $acl
     *
     * @return BaseTableGateway
     */
    public function makeTable($tableName, $adapter = null, $acl = null)
    {
        $adapter = is_null($adapter) ? $this->adapter : $adapter;
        $acl = is_null($acl) ? $this->acl : $acl;

        return static::makeTableGatewayFromTableName($tableName, $adapter, $acl);
    }

    public function getTableSchema($tableName = null)
    {
        if ($this->tableSchema !== null && ($tableName === null || $tableName === $this->getTable())) {
            return $this->tableSchema;
        }

        if ($tableName === null) {
            $tableName = $this->getTable();
        }

        $skipAcl = $this->acl === null;
        $tableSchema = SchemaService::getCollection($tableName, [], false, $skipAcl);

        if ($tableName === $this->getTable()) {
            $this->tableSchema = $tableSchema;
        }

        return $tableSchema;
    }

    /**
     * Gets the column schema (object)
     *
     * @param $columnName
     * @param null $tableName
     *
     * @return Field
     */
    public function getField($columnName, $tableName = null)
    {
        if ($tableName === null) {
            $tableName = $this->getTable();
        }

        $skipAcl = $this->acl === null;

        return SchemaService::getField($tableName, $columnName, false, $skipAcl);
    }

    /**
     * Gets the status column name
     *
     * @return string
     */
    public function getStatusFieldName()
    {
        return $this->getTableSchema()->getStatusField();
    }

    public function withKey($key, $resultSet)
    {
        $withKey = [];
        foreach ($resultSet as $row) {
            $withKey[$row[$key]] = $row;
        }
        return $withKey;
    }

    /**
     * Create a new row
     *
     * @param null $table
     * @param null $primaryKeyColumn
     *
     * @return BaseRowGateway
     */
    public function newRow($table = null, $primaryKeyColumn = null)
    {
        $table = is_null($table) ? $this->table : $table;
        $primaryKeyColumn = is_null($primaryKeyColumn) ? $this->primaryKeyFieldName : $primaryKeyColumn;
        $row = new BaseRowGateway($primaryKeyColumn, $table, $this->adapter, $this->acl);

        return $row;
    }

    public function find($id, $pk_field_name = null)
    {
        if ($pk_field_name == null) {
            $pk_field_name = $this->primaryKeyFieldName;
        }

        $record = $this->findOneBy($pk_field_name, $id);

        return $record ? $this->parseRecordValuesByType($record) : null;
    }

    public function fetchAll($selectModifier = null)
    {
        return $this->select(function (Select $select) use ($selectModifier) {
            if (is_callable($selectModifier)) {
                $selectModifier($select);
            }
        });
    }

    /**
     * @return array All rows in array form with record IDs for the array's keys.
     */
    public function fetchAllWithIdKeys($selectModifier = null)
    {
        $allWithIdKeys = [];
        $all = $this->fetchAll($selectModifier)->toArray();
        return $this->withKey('id', $all);
    }

    public function findOneBy($field, $value)
    {
        $rowset = $this->ignoreFilters()->select(function (Select $select) use ($field, $value) {
            $select->limit(1);
            $select->where->equalTo($field, $value);
        });

        $row = $rowset->current();
        // Supposing this "one" doesn't exist in the DB
        if (!$row) {
            return false;
        }

        return $row->toArray();
    }

    public function findOneByArray(array $data)
    {
        $rowset = $this->select($data);

        $row = $rowset->current();
        // Supposing this "one" doesn't exist in the DB
        if (!$row) {
            return false;
        }

        return $row->toArray();
    }

    public function addOrUpdateRecordByArray(array $recordData, $collectionName = null)
    {
        $collectionName = is_null($collectionName) ? $this->table : $collectionName;
        $this->validateRecordArray($recordData);

        $TableGateway = $this->makeTable($collectionName);
        $primaryKey = $TableGateway->primaryKeyFieldName;
        $hasPrimaryKeyData = isset($recordData[$primaryKey]);
        $rowExists = false;
        $currentItem = null;
        $originalFilename = null;

        if ($hasPrimaryKeyData) {
            $select = new Select($collectionName);
            $select->columns(['*']);
            $select->where([
                $primaryKey => $recordData[$primaryKey]
            ]);
            $select->limit(1);
            $result = $TableGateway->ignoreFilters()->selectWith($select);
            $rowExists = $result->count() > 0;
            if ($rowExists) {
                $currentItem = $result->current()->toArray();
            }
        }

        if ($rowExists) {
            $result = $TableGateway->updateRecordByArray($recordData);
        } else {
            $result = $TableGateway->addRecordByArray($recordData);
        }

        return $result;
    }

    public function addRecordByArray(array $recordData)
    {
        $this->validateRecordArray($recordData);

        $listenerId = null;
        if (static::$emitter && $this->shouldUseFilter()) {
            $hookName = 'item.create.' . SchemaManager::COLLECTION_FILES;
            // TODO: Implement once execute. Allowing a hook callback to run once.
            $listenerId = static::$emitter->addAction($hookName, function ($data) use (&$recordData) {
                $recordData['filename_disk'] = $data['filename_disk'];
            }, Emitter::P_LOW);
        }

        $TableGateway = $this->makeTable($this->table);
        $primaryKey = $TableGateway->primaryKeyFieldName;

        if (!$this->shouldUseFilter()) {
            $TableGateway->ignoreFilters();
        }

        $TableGateway->insert($recordData);
        if (static::$emitter && $listenerId) {
            static::$emitter->removeListenerWithIndex($listenerId);
        }

        // Only get the last inserted id, if the column has auto increment value
        $columnObject = $this->getTableSchema()->getField($primaryKey);
        if ($columnObject->hasAutoIncrement()) {
            $recordData[$primaryKey] = $TableGateway->getLastInsertValue();
        }
        else if ($columnObject->hasPrimaryKey())
        {
            // identify the autoincrement field+value to retrieve the new record
            $fieldAutoIncrement = null;
            foreach($this->getTableSchema()->getFields() as $f) {
                if ($f->hasAutoIncrement()) {
                    $fieldAutoIncrement = $f->getName();
                    $lastInsertValue = $TableGateway->getLastInsertValue();
                    break;
                }
            }

            // retrieve the full record
            if (isset($fieldAutoIncrement)) {
                $record = $this->findOneBy($fieldAutoIncrement, $lastInsertValue);
                $recordData[$primaryKey] = $record[$primaryKey];
            }
        }

        $columns = SchemaService::getAllNonAliasCollectionFieldNames($this->table);
        return $TableGateway->fetchAll(function (Select $select) use ($recordData, $columns, $primaryKey) {
            $select
                ->columns($columns)
                ->limit(1);
            $select->where->equalTo($primaryKey, $recordData[$primaryKey]);
        })->current();
    }

    public function updateRecordByArray(array $recordData)
    {
        $collectionName = $this->table;
        $this->validateRecordArray($recordData);

        $TableGateway = $this->makeTable($collectionName);
        $primaryKey = $TableGateway->primaryKeyFieldName;
        $hasPrimaryKeyData = isset($recordData[$primaryKey]);
        $currentItem = null;
        $originalFilename = null;

        if (!$hasPrimaryKeyData) {
            throw new UnprocessableEntityException();
        }

        $recordId = $recordData[$primaryKey];

        $Update = new Update($collectionName);
        $Update->set($recordData);
        $Update->where([
            $primaryKey => $recordId
        ]);
        $TableGateway->updateWith($Update);

        $columns = SchemaService::getAllNonAliasCollectionFieldNames($collectionName);
        return $TableGateway->fetchAll(function ($select) use ($recordData, $columns, $primaryKey) {
            $select
                ->columns($columns)
                ->limit(1);
            $select->where->equalTo($primaryKey, $recordData[$primaryKey]);
        })->current();
    }

    public function drop($tableName = null)
    {
        if ($tableName == null) {
            $tableName = $this->table;
        }

        if ($this->acl) {
            $this->acl->enforceAlter($tableName);
        }

        $dropped = false;
        if ($this->schemaManager->collectionExists($tableName)) {
            // get drop table query
            $sql = new Sql($this->adapter);
            $drop = new Ddl\DropTable($tableName);
            $query = $sql->buildSqlString($drop);

            $this->runHook('collection.delete:before', [$tableName]);

            $dropped = $this->getAdapter()->query(
                $query
            )->execute();
        }

        $this->stopManaging();

        $this->runHook('collection.delete', [$tableName]);
        $this->runHook('collection.delete:after', [$tableName]);

        return $dropped;
    }

    /**
     * Stop managing a table by removing privileges, preferences columns and table information
     *
     * @param null $tableName
     *
     * @return bool
     */
    public function stopManaging($tableName = null)
    {
        if ($tableName == null) {
            $tableName = $this->table;
        }

        // Remove table privileges
        if ($tableName != SchemaManager::COLLECTION_PERMISSIONS) {
            $privilegesTableGateway = new TableGateway(SchemaManager::COLLECTION_PERMISSIONS, $this->adapter);
            $privilegesTableGateway->delete(['collection' => $tableName]);
        }

        // Remove columns from directus_columns
        $columnsTableGateway = new TableGateway(SchemaManager::COLLECTION_FIELDS, $this->adapter);
        $columnsTableGateway->delete([
            'collection' => $tableName
        ]);

        // Remove entries from directus_relations
        $columnsTableGateway = new TableGateway(SchemaManager::COLLECTION_RELATIONS, $this->adapter);
        $columnsTableGateway->delete([
            'collection_many' => $tableName
        ]);

        // Remove table from directus_tables
        $tablesTableGateway = new TableGateway(SchemaManager::COLLECTION_COLLECTIONS, $this->adapter);
        $tablesTableGateway->delete([
            'collection' => $tableName
        ]);

        // Remove table from directus_collection_presets
        $preferencesTableGateway = new TableGateway(SchemaManager::COLLECTION_COLLECTION_PRESETS, $this->adapter);
        $preferencesTableGateway->delete([
            'collection' => $tableName
        ]);

        return true;
    }

    public function dropField($columnName, $tableName = null)
    {
        if ($tableName == null) {
            $tableName = $this->table;
        }

        if ($this->acl) {
            $this->acl->enforceAlter($tableName);
        }

        if (!SchemaService::hasCollectionField($tableName, $columnName, true)) {
            return false;
        }

        // Drop table column if is a non-alias column
        if (!array_key_exists($columnName, array_flip(SchemaService::getAllAliasCollectionFields($tableName, true)))) {
            $sql = new Sql($this->adapter);
            $alterTable = new Ddl\AlterTable($tableName);
            $dropColumn = $alterTable->dropColumn($columnName);
            $query = $sql->getSqlStringForSqlObject($dropColumn);

            $this->adapter->query(
                $query
            )->execute();
        }

        // Remove column from directus_columns
        $columnsTableGateway = new TableGateway(SchemaManager::COLLECTION_FIELDS, $this->adapter);
        $columnsTableGateway->delete([
            'table_name' => $tableName,
            'column_name' => $columnName
        ]);

        // Remove column from sorting column in directus_preferences
        $preferencesTableGateway = new TableGateway(SchemaManager::COLLECTION_COLLECTION_PRESETS, $this->adapter);
        $preferencesTableGateway->update([
            'sort' => $this->primaryKeyFieldName,
            'sort_order' => 'ASC'
        ], [
            'table_name' => $tableName,
            'sort' => $columnName
        ]);

        return true;
    }

    /*
      Temporary solutions to fix add column error
        This add column is the same old-db add_column method
    */
    public function addColumn($tableName, $tableData)
    {
        // @TODO: enforce permission
        $directus_types = ['MANYTOMANY', 'ONETOMANY', 'ALIAS'];
        $relationshipType = ArrayUtils::get($tableData, 'relationship_type', null);
        // TODO: list all types which need manytoone ui
        // Hard-coded
        $manytoones = ['single_file', 'many_to_one', 'many_to_one_typeahead', 'MANYTOONE'];

        if (!in_array($relationshipType, $directus_types)) {
            $this->addTableColumn($tableName, $tableData);
            // Temporary solutions to #481, #645
            if (array_key_exists('ui', $tableData) && in_array($tableData['ui'], $manytoones)) {
                $tableData['relationship_type'] = 'MANYTOONE';
                $tableData['junction_key_right'] = $tableData['column_name'];
            }
        }

        //This is a 'virtual column'. Write to directus schema instead of MYSQL
        $this->addVirtualColumn($tableName, $tableData);

        return $tableData['column_name'];
    }

    // @TODO: TableGateway should not be handling table creation
    protected function addTableColumn($tableName, $columnData)
    {
        $column_name = $columnData['column_name'];
        $dataType = $columnData['data_type'];
        $comment = $this->getAdapter()->getPlatform()->quoteValue(ArrayUtils::get($columnData, 'comment', ''));

        if (array_key_exists('length', $columnData)) {
            $charLength = $columnData['length'];
            // SET and ENUM data type has its values in the char_length attribute
            // each value are separated by commas
            // it must be wrap into quotes
            if (!$this->schemaManager->isFloatingPointType($dataType) && strpos($charLength, ',') !== false) {
                $charLength = implode(',', array_map(function ($value) {
                    return '"' . trim($value) . '"';
                }, explode(',', $charLength)));
            }

            $dataType = $dataType . '(' . $charLength . ')';
        }

        $default = '';
        if (ArrayUtils::get($columnData, 'default_value')) {
            $value = ArrayUtils::get($columnData, 'default_value');
            $length = ArrayUtils::get($columnData, 'length');
            $defaultValue = $this->schemaManager->castDefaultValue($value, $dataType, $length);

            $default = ' DEFAULT ' . (is_string($defaultValue) ? sprintf('"%s"', $defaultValue) : $defaultValue);
        }

        // TODO: wrap this into an abstract DDL class
        $sql = 'ALTER TABLE `' . $tableName . '` ADD COLUMN `' . $column_name . '` ' . $dataType . $default . ' COMMENT "' . $comment . '"';

        $this->adapter->query($sql)->execute();
    }

    protected function addVirtualColumn($tableName, $columnData)
    {
        $alias_columns = ['table_name', 'column_name', 'data_type', 'related_table', 'junction_table', 'junction_key_left', 'junction_key_right', 'sort', 'ui', 'comment', 'relationship_type'];

        $columnData['table_name'] = $tableName;
        // NOTE: setting 9999 as default just because
        $columnData['sort'] = ArrayUtils::get($columnData, 'sort', 9999);

        $data = array_intersect_key($columnData, array_flip($alias_columns));
        return $this->addOrUpdateRecordByArray($data, 'directus_columns');
    }

    public function castFloatIfNumeric(&$value, $key)
    {
        if ($key != 'table_name') {

            // anything that "looks like" a number
            if(is_numeric($value)) {

                // match any string with a comma
                // e.g. "3.14159265358979323846264338327950288419"
                // warning: number will be truncated to 16 digits (IEEE 754)
                if(preg_match('/^-?(\d*\.\d+)$/', $value) === TRUE) {
                    $value = (float) $value;
                }

                // match any string with an integer number
                // of any integer number, e.g.
                // "+/-14159265358979323846264338327950288419"
                // +/-14159265358979323846264338327950288419
                else
                    $value = (int) $value;
            }
        }
    }

    /**
     * Convenience method for dumping a ZendDb Sql query object as debug output.
     *
     * @param  SqlInterface $query
     *
     * @return null
     */
    public function dumpSql(SqlInterface $query)
    {
        $sql = new Sql($this->adapter);
        $query = $sql->getSqlStringForSqlObject($query, $this->adapter->getPlatform());
        return $query;
    }

    public function ignoreFilters()
    {
        $this->options['filter'] = false;

        return $this;
    }

    /**
     * @param Select $select
     *
     * @return ResultSet
     *
     * @throws \Directus\Permissions\Exception\ForbiddenFieldReadException
     * @throws \Directus\Permissions\Exception\ForbiddenFieldWriteException
     * @throws \Exception
     */
    protected function executeSelect(Select $select)
    {

        $useFilter = $this->shouldUseFilter();
        unset($this->options['filter']);

        if ($this->acl) {
            $this->enforceSelectPermission($select);
        }

        $selectState = $select->getRawState();
        $selectCollectionName = $selectState['table'];

        if ($useFilter) {
            $selectState = $this->applyHooks([
                'item.read:before',
                'item.read.' . $selectCollectionName . ':before',
            ], $selectState, [
                'collection_name' => $selectCollectionName
            ]);

            // NOTE: This can be a "dangerous" hook, so for now we only support columns
            $select->columns(ArrayUtils::get($selectState, 'columns', ['*']));
        }

        try {
            $result = parent::executeSelect($select);
        } catch (UnexpectedValueException $e) {
            throw new InvalidQueryException(
                $this->dumpSql($select),
                $e
            );
        }

        if ($useFilter) {
            $result = $this->applyHooks([
                'item.read',
                'item.read.' . $selectCollectionName
            ], $result, [
                'selectState' => $selectState,
                'collection_name' => $selectCollectionName
            ]);
        }

        return $result;
    }

    /**
     * @param Insert $insert
     *
     * @return mixed
     *
     * @throws \Directus\Database\Exception\InvalidQueryException
     */
    protected function executeInsert(Insert $insert)
    {
        $useFilter = $this->shouldUseFilter();
        unset($this->options['filter']);

        if ($this->acl) {
            $this->enforceInsertPermission($insert);
        }

        $insertState = $insert->getRawState();
        $insertTable = $this->getRawTableNameFromQueryStateTable($insertState['table']);
        $insertData = $insertState['values'];
        // Data to be inserted with the column name as assoc key.
        $insertDataAssoc = array_combine($insertState['columns'], $insertData);

        if ($useFilter) {
            $this->runHook('item.create:before', [$insertTable, $insertDataAssoc]);
            $this->runHook('item.create.' . $insertTable . ':before', [$insertDataAssoc]);

            $newInsertData = $this->applyHook('item.create:before', $insertDataAssoc, [
                'collection_name' => $insertTable
            ]);
            $newInsertData = $this->applyHook('item.create.' . $insertTable . ':before', $newInsertData);

            // NOTE: set the primary key to null
            // to default the value to whatever increment value is next
            // avoiding the error of inserting nothing
            if (empty($newInsertData)) {
                $newInsertData[$this->primaryKeyFieldName] = null;
            }

            $insert->values($newInsertData);
        }

        try {
            $result = parent::executeInsert($insert);
        } catch (UnexpectedValueException $e) {
            if (
                strtolower($this->adapter->platform->getName()) === 'mysql'
                && strpos(strtolower($e->getMessage()), 'duplicate entry') !== false
            ) {
                preg_match("/Duplicate entry '([^']+)' for key '([^']+)'/i", $e->getMessage(), $output);

                if ($output) {
                    throw new DuplicateItemException($this->table, $output[1]);
                }
            }

            throw new InvalidQueryException(
                $this->dumpSql($insert),
                $e
            );
        }

        $insertTableGateway = $this->makeTable($insertTable);

        // hotfix: directus_tables does not have auto generated value primary key
        if ($this->getTable() === SchemaManager::COLLECTION_COLLECTIONS) {
            $generatedValue = ArrayUtils::get($insertDataAssoc, $this->primaryKeyFieldName, 'table_name');
        } else {
            $generatedValue = $this->getLastInsertValue();
        }

        $resultData = $insertTableGateway->find($generatedValue);

        // try to retrieve the record using another field
        if (empty($resultData)) {
            $columnObject = $this->getTableSchema()->getField($this->primaryKeyFieldName);
            if ($columnObject->hasPrimaryKey()) {
                $fieldAutoIncrement = null;
                foreach($this->getTableSchema()->getFields() as $f) {
                    $fieldAutoIncrement = $f->getName();
                    $lastInsertValue = $this->getLastInsertValue();
                    break;
                }

                if (isset($fieldAutoIncrement))
                    $resultData = $this->findOneBy($fieldAutoIncrement, $lastInsertValue);
            }
        }

        if ($useFilter) {
            $this->runHook('item.create', [$insertTable, $resultData]);
            $this->runHook('item.create.' . $insertTable, [$resultData]);
            $this->runHook('item.create:after', [$insertTable, $resultData]);
            $this->runHook('item.create.' . $insertTable . ':after', [$resultData]);
        }

        return $result;
    }

    /**
     * @param Update $update
     *
     * @return mixed
     *
     * @throws \Directus\Database\Exception\InvalidQueryException
     */
    protected function executeUpdate(Update $update)
    {
        $useFilter = $this->shouldUseFilter();
        unset($this->options['filter']);

        if ($this->acl) {
            $this->enforceUpdatePermission($update);
        }

        $updateState = $update->getRawState();
        $updateTable = $this->getRawTableNameFromQueryStateTable($updateState['table']);
        $updateData = $updateState['set'];

        if ($useFilter) {
            $updateData = $this->runBeforeUpdateHooks($updateTable, $updateData);
        }

        $update->set($updateData);

        try {
            $result = parent::executeUpdate($update);
        } catch (UnexpectedValueException $e) {
            throw new InvalidQueryException(
                $this->dumpSql($update),
                $e
            );
        }

        if ($useFilter) {
            $this->runAfterUpdateHooks($updateTable, $updateData);
        }

        //Invalidate individual cache
        if (static::$container) {
            $config = static::$container->get('config');
            if ($config->get('cache.enabled')) {
                $cachePool = static::$container->get('cache');
                $cachePool->invalidateTags(['entity_' . $updateTable . '_' . $result[$this->primaryKeyFieldName]]);
            }
        }

        return $result;
    }

    /**
     * @param Delete $delete
     *
     * @return mixed
     *
     * @throws \Directus\Database\Exception\InvalidQueryException
     */
    protected function executeDelete(Delete $delete)
    {
        $ids = [];

        if ($this->acl) {
            $this->enforceDeletePermission($delete);
        }

        $deleteState = $delete->getRawState();
        $deleteTable = $this->getRawTableNameFromQueryStateTable($deleteState['table']);

        // Runs select PK with passed delete's $where before deleting, to use those for the even hook
        if ($pk = $this->primaryKeyFieldName) {
            $select = $this->sql->select();
            $select->where($deleteState['where']);
            $results = parent::executeSelect($select);

            $deletedObject = [];
            foreach ($results as $result) {
                $ids[] = $result[$this->primaryKeyFieldName];
                $deletedObject[$result[$this->primaryKeyFieldName]] = $result->toArray();
            }
        }

        // skipping everything, if there is nothing to delete
        if ($ids) {
            $delete = $this->sql->delete();
            $expression = new In($pk, $ids);
            $delete->where($expression);

            foreach ($ids as $id) {
                $deleteData = [$this->primaryKeyFieldName => $id];
                $this->runHook('item.delete:before', [$deleteTable, $deleteData]);
                $this->runHook('item.delete.' . $deleteTable . ':before', [$deleteData]);
            }

            try {
                $result = parent::executeDelete($delete);
            } catch (UnexpectedValueException $e) {
                throw new InvalidQueryException(
                    $this->dumpSql($delete),
                    $e
                );
            }


            //Invalidate individual cache
            if (static::$container) {
                $config = static::$container->get('config');
            }
            foreach ($ids as $id) {
                $deleteData = $deletedObject[$id];
                $this->runHook('item.delete', [$deleteTable, $deleteData]);
                $this->runHook('item.delete:after', [$deleteTable, $deleteData]);
                $this->runHook('item.delete.' . $deleteTable, [$deleteData]);
                $this->runHook('item.delete.' . $deleteTable . ':after', [$deleteData]);
                if (isset($config) && $config->get('cache.enabled')) {
                    $cachePool = static::$container->get('cache');
                    $cachePool->invalidateTags(['entity_' . $deleteTable . '_' . $deleteData[$this->primaryKeyFieldName]]);
                }
            }



            return $result;
        }
    }

    protected function getRawTableNameFromQueryStateTable($table)
    {
        if (is_string($table)) {
            return $table;
        }

        if (is_array($table)) {
            // The only value is the real table name (key is alias).
            return array_pop($table);
        }

        throw new \InvalidArgumentException('Unexpected parameter of type ' . get_class($table));
    }

    /**
     * Convert dates to ISO 8601 format
     *
     * @param array $records
     * @param Collection $tableSchema
     * @param null $tableName
     *
     * @return array|mixed
     */
    public function convertDates(array $records, Collection $tableSchema, $tableName = null)
    {
        // ==========================================================================
        // hotfix: records sometimes are no set as an array of rows.
        // NOTE: this code is duplicate @see: AbstractSchema::parseRecordValuesByType
        // ==========================================================================
        $singleRecord = false;
        if (!ArrayUtils::isNumericKeys($records)) {
            $records = [$records];
            $singleRecord = true;
        }

        foreach ($records as $index => $row) {
            foreach ($tableSchema->getFields(array_keys($row)) as $column) {
                if (!DataTypes::isSystemDateTimeType($column->getType()) || !isset($row[$column->getName()])) {
                    continue;
                }

                $columnName = $column->getName();
                $datetime = DateTimeUtils::createFromDefaultFormat($row[$columnName], 'UTC');
                $records[$index][$columnName] = $datetime->toISO8601Format();
            }
        }

        return $singleRecord ? reset($records) : $records;
    }

    /**
     * Parse records value by its column type
     *
     * @param array $records
     * @param null $tableName
     *
     * @return array
     */
    protected function parseRecordValuesByType(array $records, $tableName = null)
    {
        // NOTE: Performance spot
        $tableName = $tableName === null ? $this->table : $tableName;
        // Get the columns directly from the source
        // otherwise will keep in a circle loop loading Acl Instances
        $columns = SchemaService::getSchemaManagerInstance()->getFields($tableName);

        return $this->schemaManager->castRecordValues($records, $columns);
    }

    /**
     * Parse Records values (including format date by ISO 8601) by its column type
     *
     * @param $records
     * @param null $tableName
     *
     * @return array|mixed
     */
    public function parseRecord($records, $tableName = null)
    {
        // NOTE: Performance spot
        if (is_array($records)) {
            $tableName = $tableName === null ? $this->table : $tableName;
            $records = $this->parseRecordValuesByType($records, $tableName);
            $tableSchema = $this->getTableSchema($tableName);
            $records = $this->convertDates($records, $tableSchema, $tableName);
        }

        return $records;
    }

    /**
     * Enforce permission on Select
     *
     * @param Select $select
     *
     * @throws \Exception
     */
    protected function enforceSelectPermission(Select $select)
    {
        $selectState = $select->getRawState();
        $table = $this->getRawTableNameFromQueryStateTable($selectState['table']);

        // @TODO: enforce view permission

        // Enforce field read blacklist on Select's main table
        try {
            // @TODO: Enforce must return a list of columns without the blacklist
            // when asterisk (*) is used
            // and only throw and error when all the selected columns are blacklisted
            $this->acl->enforceReadField($table, $selectState['columns']);
        } catch (\Exception $e) {
            if ($selectState['columns'][0] != '*') {
                throw $e;
            }

            $selectState['columns'] = SchemaService::getAllNonAliasCollectionFieldsName($table);
            $this->acl->enforceReadField($table, $selectState['columns']);
        }

        // Enforce field read blacklist on Select's join tables
        foreach ($selectState['joins'] as $join) {
            $joinTable = $this->getRawTableNameFromQueryStateTable($join['name']);
            $this->acl->enforceReadField($joinTable, $join['columns']);
        }
    }

    /**
     * Enforce permission on Insert
     *
     * @param Insert $insert
     *
     * @throws \Exception
     */
    public function enforceInsertPermission(Insert $insert)
    {
        $insertState = $insert->getRawState();
        $insertTable = $this->getRawTableNameFromQueryStateTable($insertState['table']);

        $statusValue = null;
        $statusField = $this->getTableSchema()->getStatusField();
        if ($statusField) {
            $valueKey = array_search($statusField->getName(), $insertState['columns']);
            if ($valueKey !== false) {;
                $statusValue = ArrayUtils::get($insertState['values'], $valueKey);
            } else {
                $statusValue = $statusField->getDefaultValue();
            }
        }

        $this->acl->enforceCreate($insertTable, $statusValue);
    }

    /**
     * @param Builder $builder
     *
     * @throws ForbiddenCollectionReadException
     * @throws UnableFindOwnerItemsException
     */
    protected function enforceReadPermission(Builder $builder)
    {
        if (!$this->acl) {
            return;
        }

        // ----------------------------------------------------------------------------
        // Fixed owner field for system collections
        // ----------------------------------------------------------------------------
        switch ($this->table) {
            case SchemaManager::COLLECTION_ROLES:
                $field = 'id';
                break;
            case SchemaManager::COLLECTION_ACTIVITY:
                $field = 'action_by';
                break;
            case SchemaManager::COLLECTION_PERMISSIONS:
                $field = 'role';
                break;
            default:
                $field = null;
        }

        if ($field) {
            $permission = $this->acl->getPermission($this->table);
            $readPermission = ArrayUtils::get($permission, Acl::ACTION_READ);
            $rolesIds = [];

            // TODO: Implement how to process `role` permission
            if ($readPermission === Acl::LEVEL_MINE) {
                $rolesIds = $this->acl->getRolesId();
            }

            if (!empty($rolesIds)) {
                $builder->whereIn($field, $rolesIds);
                return;
            }
        }

        // ----------------------------------------------------------------------------
        // Make sure the user has permission to at least their items
        // ----------------------------------------------------------------------------
        $this->acl->enforceReadOnce($this->table);
        $collectionObject = $this->getTableSchema();
        $statuses = $this->acl->getCollectionStatuses($this->table);
        $statusField = $collectionObject->getStatusField();

        $userCreatedField = $collectionObject->getUserCreatedField();
        if ($this->schemaManager->isSystemCollection($this->table)) {
            switch ($this->table) {
                case SchemaManager::COLLECTION_USERS:
                    $userCreatedField = $collectionObject->getField('id');
                    break;
            }
        }

        // throw exception if the user has status permission enabled and not status field
        if (!empty($statuses) && !$statusField) {
            throw new ForbiddenCollectionReadException($this->table);
        }

        // If there's not user created or status interface, user must have full read permission
        if (!$userCreatedField && !$statusField) {
            $this->acl->enforceReadAll($this->table);
            return;
        }

        // If User can read all items, nothing else needs to be checked
        if (empty($statuses) && $this->acl->canReadAll($this->table)) {
            return;
        }

        $groupUsersId = \Directus\get_user_ids_in_group($this->acl->getRolesId());
        $authenticatedUserId = $this->acl->getUserId();

        if (empty($statuses)) {
            if (!$userCreatedField && !$this->acl->canReadAll($this->table)) {
                throw new UnableFindOwnerItemsException($this->table);
            }

            $ownerIds = [$authenticatedUserId];
            if ($this->acl->canReadFromRole($this->table)) {
                $ownerIds = array_merge(
                    $ownerIds,
                    $groupUsersId
                );
            }

            $builder->whereIn($userCreatedField->getName(), $ownerIds);
        } else {
            $collection = $this->table;
            $builder->nestWhere(function (Builder $builder) use ($collection, $statuses, $statusField, $userCreatedField, $groupUsersId, $authenticatedUserId) {
                foreach ($statuses as $status) {
                    $canReadAll = $this->acl->canReadAll($collection, $status);
                    $canReadMine = $this->acl->canReadMine($collection, $status);

                    if ((!$canReadAll && !$userCreatedField) || !$canReadMine) {
                        continue;
                    }

                    $ownerIds = $canReadAll ? null : [$authenticatedUserId];
                    if (!$canReadAll && $this->acl->canReadFromRole($collection, $status)) {
                        $ownerIds = array_merge(
                            $ownerIds,
                            $groupUsersId
                        );
                    }

                    $builder->nestOrWhere(function (Builder $builder) use ($statuses, $ownerIds, $statusField, $userCreatedField, $status) {
                        if ($ownerIds) {
                            $builder->whereIn($userCreatedField->getName(), $ownerIds);
                        }

                        $builder->whereEqualTo($statusField->getName(), $status);
                    });
                }
            });
        }
    }

    /**
     * Enforce permission on Update
     *
     * @param Update $update
     *
     * @throws \Exception
     */
    public function enforceUpdatePermission(Update $update)
    {
        $collectionObject = $this->getTableSchema();
        $statusField = $collectionObject->getStatusField();
        $updateState = $update->getRawState();
        $updateData = $updateState['set'];

        //If a collection has status field then records are not actually deleting, they are soft deleting
        //Check delete permission for soft delete
        if (
            $statusField
            && ArrayUtils::has($updateData, $statusField->getName())
            && in_array(
                ArrayUtils::get($updateData, $collectionObject->getStatusField()->getName()),
                $this->getStatusMapping()->getSoftDeleteStatusesValue()
            )
        ) {
            $delete = $this->sql->delete();
            $delete->where($updateState['where']);
            $this->enforceDeletePermission($delete);
            return;
        }

        if ($this->acl->canUpdateAll($this->table) && $this->acl->isAdmin()) {
            return;
        }

        $currentUserId = $this->acl->getUserId();
        $updateTable = $this->getRawTableNameFromQueryStateTable($updateState['table']);
        $select = $this->sql->select();
        $select->where($updateState['where']);
        $select->limit(1);
        $item = $this->ignoreFilters()->selectWith($select)->toArray();
        $item = reset($item);
        $statusId = null;

        // Item not found, item cannot be updated
        if (!$item) {
            throw new ForbiddenCollectionUpdateException($updateTable);
        }

        // Enforce write field blacklist
        $this->acl->enforceWriteField($updateTable, array_keys($updateState['set']));

        if ($collectionObject->hasStatusField()) {
            $statusField = $this->getTableSchema()->getStatusField();
            $statusId = $item[$statusField->getName()];

            // non-admins cannot update soft-deleted items
            $status = $this->getStatusMapping()->getByValue($statusId);
            if ($status && $status->isSoftDelete()) {
                throw new ForbiddenCollectionUpdateException($updateTable);
            }
        }

        // User Created Interface not found, item cannot be updated
        $itemOwnerField = $this->getTableSchema()->getUserCreatedField();
        if (!$itemOwnerField) {

            /** User object dont have a created_by field so we cant get the owner and not able to update
             * the profile. Thus we need to check manually that whether its update profile or not.
             */
            if ($this->table == SchemaManager::COLLECTION_USERS  && $item['id'] == $currentUserId) {
                $this->acl->enforceUpdate($updateTable, $statusId);
                return;
            }

            /** Object dont have a created_by field so we cant get the owner and not able to fetch
             *  the bookmarks.
             */
            if ($this->table == SchemaManager::COLLECTION_COLLECTION_PRESETS  && $item['user'] == $currentUserId) {
                $this->acl->enforceUpdate($updateTable, $statusId);
                return;
            }
            $this->acl->enforceUpdateAll($updateTable, $statusId);
            return;
        }

        // Owner not found, item cannot be updated
        $owner = \Directus\get_item_owner($updateTable, $item[$collectionObject->getPrimaryKeyName()]);
        if (!is_array($owner)) {
            throw new ForbiddenCollectionUpdateException($updateTable);
        }

        $userItem = $currentUserId === $owner['id'];
        $hasRole = $this->acl->hasRole($owner['role']);
        if (!$userItem && !$hasRole && !$this->acl->canUpdateAll($updateTable, $statusId)) {
            throw new ForbiddenCollectionUpdateException($updateTable);
        }

        if (!$userItem && $hasRole) {
            $this->acl->enforceUpdateFromRole($updateTable, $statusId);
        } else if ($userItem) {
            $this->acl->enforceUpdate($updateTable, $statusId);
        }
    }

    /**
     * Enforce permission on Delete
     *
     * @param Delete $delete
     *
     * @throws ForbiddenCollectionDeleteException
     */
    public function enforceDeletePermission(Delete $delete)
    {
        $collectionObject = $this->getTableSchema();
        $currentUserId = $this->acl->getUserId();
        $deleteState = $delete->getRawState();
        $deleteTable = $this->getRawTableNameFromQueryStateTable($deleteState['table']);
        // $cmsOwnerColumn = $this->acl->getCmsOwnerColumnByTable($deleteTable);
        // $canBigDelete = $this->acl->hasTablePrivilege($deleteTable, 'bigdelete');
        // $canDelete = $this->acl->hasTablePrivilege($deleteTable, 'delete');
        // $aclErrorPrefix = $this->acl->getErrorMessagePrefix();

        $select = $this->sql->select();
        $select->where($deleteState['where']);
        $select->limit(1);
        $item = $this->ignoreFilters()->selectWith($select)->toArray();
        $item = reset($item);
        $statusId = null;

        // Item not found, item cannot be updated
        if (!$item) {
            throw new ItemNotFoundException();
        }

        if ($collectionObject->hasStatusField()) {
            $statusField = $this->getTableSchema()->getStatusField();
            $statusId = $item[$statusField->getName()];
        }

        // User Created Interface not found, item cannot be updated
        $itemOwnerField = $this->getTableSchema()->getUserCreatedField();
        if (!$itemOwnerField) {
            $this->acl->enforceDeleteAll($deleteTable, $statusId);
            return;
        }

        // Owner not found, item cannot be updated
        $owner = \Directus\get_item_owner($deleteTable, $item[$collectionObject->getPrimaryKeyName()]);
        if (!is_array($owner)) {
            throw new ForbiddenCollectionDeleteException($deleteTable);
        }

        $userItem = $currentUserId === $owner['id'];
        $hasRole = $this->acl->hasRole($owner['role']);
        if (!$userItem && !$hasRole && !$this->acl->canDeleteAll($deleteTable, $statusId)) {
            throw new ForbiddenCollectionDeleteException($deleteTable);
        }

        if (!$userItem && $hasRole) {
            $this->acl->enforceDeleteFromRole($deleteTable, $statusId);
        } else if ($userItem) {
            $this->acl->enforceDelete($deleteTable, $statusId);
        }

        // @todo: clean way
        // @TODO: this doesn't need to be bigdelete
        //        the user can only delete their own entry
        // if ($deleteTable === 'directus_bookmarks') {
        //     $canBigDelete = true;
        // }

        // @TODO: Update conditions
        // =============================================================================
        // Cannot delete if there's no magic owner column and can't big delete
        // All deletes are "big" deletes if there is no magic owner column.
        // =============================================================================
        // if (false === $cmsOwnerColumn && !$canBigDelete) {
        //     throw new ForbiddenCollectionDeleteException($aclErrorPrefix . 'The table `' . $deleteTable . '` is missing the `user_create_column` within `directus_collections` (BigHardDelete Permission Forbidden)');
        // } else if (!$canBigDelete) {
        //     // Who are the owners of these rows?
        //     list($predicateResultQty, $predicateOwnerIds) = $this->acl->getCmsOwnerIdsByTableGatewayAndPredicate($this, $deleteState['where']);
        //     if (!in_array($currentUserId, $predicateOwnerIds)) {
        //         //   $exceptionMessage = "Table harddelete access forbidden on $predicateResultQty `$deleteTable` table records owned by the authenticated CMS user (#$currentUserId).";
        //         $groupsTableGateway = $this->makeTable('directus_roles');
        //         $group = $groupsTableGateway->find($this->acl->getGroupId());
        //         $exceptionMessage = '[' . $group['name'] . '] permissions only allow you to [delete] your own items.';
        //         //   $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
        //         throw new  ForbiddenCollectionDeleteException($exceptionMessage);
        //     }
        // }
    }

    /**
     * Get the column identifier with the specific quote and table prefixed
     *
     * @param string $column
     * @param string|null $table
     *
     * @return string
     */
    public function getColumnIdentifier($column, $table = null)
    {
        $platform = $this->getAdapter()->getPlatform();

        // TODO: find a common place to share this code
        // It is a duplicated code from Builder.php
        if (strpos($column, $platform->getIdentifierSeparator()) === false) {
            $column = implode($platform->getIdentifierSeparator(), [$table, $column]);
        }

        return $column;
    }

    /**
     * Get the column name from the identifier
     *
     * @param string $column
     *
     * @return string
     */
    public function getColumnFromIdentifier($column)
    {
        $platform = $this->getAdapter()->getPlatform();

        // TODO: find a common place to share this code
        // It is duplicated code in Builder.php
        if (strpos($column, $platform->getIdentifierSeparator()) !== false) {
            $identifierParts = explode($platform->getIdentifierSeparator(), $column);
            $column = array_pop($identifierParts);
        }

        return $column;
    }

    /**
     * Get the table name from the identifier
     *
     * @param string $column
     * @param string|null $table
     *
     * @return string
     */
    public function getTableFromIdentifier($column, $table = null)
    {
        $platform = $this->getAdapter()->getPlatform();

        if ($table === null) {
            $table = $this->getTable();
        }

        // TODO: find a common place to share this code
        // It is duplicated code in Builder.php
        if (strpos($column, $platform->getIdentifierSeparator()) !== false) {
            $identifierParts = explode($platform->getIdentifierSeparator(), $column);
            $table = array_shift($identifierParts);
        }

        return $table;
    }

    /**
     * Gets schema manager
     *
     * @return SchemaManager|null
     */
    public function getSchemaManager()
    {
        return $this->schemaManager;
    }

    /**
     * Set application container
     *
     * @param $container
     */
    public static function setContainer($container)
    {
        static::$container = $container;
    }

    /**
     * @return Container
     */
    public static function getContainer()
    {
        return static::$container;
    }

    public static function setHookEmitter($emitter)
    {
        static::$emitter = $emitter;
    }

    public function runHook($name, $args = null)
    {
        if (static::$emitter) {
            static::$emitter->execute($name, $args);
        }
    }

    /**
     * Apply a list of hook against the given data
     *
     * @param array $names
     * @param null $data
     * @param array $attributes
     *
     * @return array|\ArrayObject|null
     */
    public function applyHooks(array $names, $data = null, array $attributes = [])
    {
        foreach ($names as $name) {
            $data = $this->applyHook($name, $data, $attributes);
        }

        return $data;
    }

    /**
     * Apply hook against the given data
     *
     * @param $name
     * @param null $data
     * @param array $attributes
     *
     * @return \ArrayObject|array|null
     */
    public function applyHook($name, $data = null, array $attributes = [])
    {
        // TODO: Ability to run multiple hook names
        // $this->applyHook('hook1,hook2');
        // $this->applyHook(['hook1', 'hook2']);
        // ----------------------------------------------------------------------------
        // TODO: Move this to a separate class to handle common events
        // $this->applyNewRecord($table, $record);
        if (static::$emitter && static::$emitter->hasFilterListeners($name)) {
            $isResultSet = $data instanceof ResultSetInterface;
            $resultSet = null;

            if ($isResultSet) {
                $resultSet = $data;
                $data = $resultSet->toArray();
            }

            $data = static::$emitter->apply($name, $data, $attributes);

            if ($isResultSet && $resultSet) {
                $data = new \ArrayObject($data);
                $resultSet->initialize($data->getIterator());
                $data = $resultSet;
            }
        }

        return $data;
    }

    /**
     * Run before table update hooks and filters
     *
     * @param string $updateCollectionName
     * @param array $updateData
     *
     * @return array|\ArrayObject
     */
    protected function runBeforeUpdateHooks($updateCollectionName, $updateData)
    {
        // Filters
        $updateData = $this->applyHook('item.update:before', $updateData, [
            'collection_name' => $updateCollectionName
        ]);
        $updateData = $this->applyHook('item.update.' . $updateCollectionName . ':before', $updateData);

        // Hooks
        $this->runHook('item.update:before', [$updateCollectionName, $updateData]);
        $this->runHook('item.update.' . $updateCollectionName . ':before', [$updateData]);

        return $updateData;
    }

    /**
     * Run after table update hooks and filters
     *
     * @param string $updateTable
     * @param string $updateData
     */
    protected function runAfterUpdateHooks($updateTable, $updateData)
    {
        $this->runHook('item.update', [$updateTable, $updateData]);
        $this->runHook('item.update:after', [$updateTable, $updateData]);
        $this->runHook('item.update.' . $updateTable, [$updateData]);
        $this->runHook('item.update.' . $updateTable . ':after', [$updateData]);
    }

    /**
     * Gets Directus settings (from DB)
     *
     * @param null|string $key
     *
     * @return mixed
     */
    public function getSettings($key = null)
    {
        $settings = [];

        if (!static::$container) {
            return $settings;
        }

        if ($key !== null) {
            $settings = \Directus\get_directus_setting($key);
        } else {
            $settings = \Directus\get_kv_directus_settings();
        }

        return $settings;
    }

    /**
     * Get the table statuses
     *
     * @return array
     */
    public function getAllStatuses()
    {
        $statuses = [];
        $statusMapping = $this->getStatusMapping();

        if ($statusMapping) {
            $statuses = $statusMapping->getAllStatusesValue();
        }

        return $statuses;
    }

    /**
     * Gets the table non-soft-delete statuses
     *
     * @return array
     */
    public function getNonSoftDeleteStatuses()
    {
        return $this->getStatuses('non-soft-delete');
    }

    /**
     * Gets the table statuses with the given type
     *
     * @param $type
     *
     * @return array
     */
    protected function getStatuses($type)
    {
        $statuses = [];
        $statusMapping = $this->getStatusMapping();

        if ($statusMapping) {
            switch ($type) {
                case 'non-soft-delete':
                    $statuses = $statusMapping->getNonSoftDeleteStatusesValue();
                    break;
            }
        }

        return $statuses;
    }

    /**
     * Gets the collection status mapping
     *
     * @return StatusMapping|null
     *
     * @throws CollectionHasNotStatusInterfaceException
     * @throws Exception
     */
    protected function getStatusMapping()
    {
        if (!$this->getTableSchema()->hasStatusField()) {
            throw new CollectionHasNotStatusInterfaceException($this->table);
        }

        $collectionStatusMapping = $this->getTableSchema()->getStatusMapping();
        if (!$collectionStatusMapping) {
            if (!static::$container) {
                throw new Exception('collection status interface is missing status mapping and the system was unable to find the global status mapping');
            }

            $collectionStatusMapping = static::$container->get('status_mapping');
        }

        $this->validateStatusMapping($collectionStatusMapping);

        return $collectionStatusMapping;
    }

    /**
     * Validates a status mapping against the field type
     *
     * @param StatusMapping $statusMapping
     *
     * @throws CollectionHasNotStatusInterfaceException
     * @throws StatusMappingEmptyException
     * @throws StatusMappingWrongValueTypeException
     */
    protected function validateStatusMapping(StatusMapping $statusMapping)
    {
        if ($statusMapping->isEmpty()) {
            throw new StatusMappingEmptyException($this->table);
        }

        $statusField = $this->getTableSchema()->getStatusField();
        if (!$statusField) {
            throw new CollectionHasNotStatusInterfaceException($this->table);
        }

        $type = 'string';
        if ($this->schemaManager->getSource()->isNumericType($statusField->getDataType())) {
            $type = 'numeric';
        }

        foreach ($statusMapping as $status) {
            if (!call_user_func('is_' . $type, $status->getValue())) {
                throw new StatusMappingWrongValueTypeException($type, $statusField->getName(), $this->table);
            }
        }
    }

    /**
     * Validates a record array
     *
     * @param array $record
     *
     * @throws SuppliedArrayAsColumnValue
     */
    protected function validateRecordArray(array $record)
    {
        $collectionObject = $this->getTableSchema();

        foreach ($record as $columnName => $columnValue) {
            $field = $collectionObject->getField($columnName);

            if (
                ($field && is_array($columnValue)
                    && (!DataTypes::isJson($field->getType())
                        && !DataTypes::isArray($field->getType())
                        // The owner of the alias should handle it
                        // either on hook or custom field validation to ignore any value
                        && !DataTypes::isAliasType($field->getType())))
            ) {
                throw new SuppliedArrayAsColumnValue(
                    $this->table,
                    $field->getName()
                );
            }
        }
    }

    /**
     * Checks whether or not null should be sorted last
     *
     * @return bool
     */
    protected function shouldNullSortedLast()
    {
        return (bool) get_directus_setting('sort_null_last', true);
    }

    /**
     * @return bool
     */
    protected function shouldUseFilter()
    {
        return !is_array($this->options) || ArrayUtils::get($this->options, 'filter', true) !== false;
    }
}
