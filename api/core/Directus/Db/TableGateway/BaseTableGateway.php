<?php

namespace Directus\Db\TableGateway;

use Directus\Bootstrap;
use Directus\Db\Exception\SuppliedArrayAsColumnValue;
use Directus\Db\RowGateway\BaseRowGateway;
use Directus\Db\SchemaManager;
use Directus\Db\TableSchema;
use Directus\MemcacheProvider;
use Directus\Util\ArrayUtils;
use Directus\Util\DateUtils;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\ResultSet\ResultSetInterface;
use Zend\Db\Sql\Ddl;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\SqlInterface;
use Zend\Db\Sql\Update;
use Zend\Db\Sql\Where;
use Zend\Db\TableGateway\Feature;
use Zend\Db\TableGateway\Feature\RowGatewayFeature;
use Zend\Db\TableGateway\TableGateway;

class BaseTableGateway extends TableGateway
{
    public $primaryKeyFieldName = 'id';
    public $memcache;

    /**
     * Hook Emitter Instance
     *
     * @var \Directus\Hook\Emitter
     */
    protected static $emitter = null;

    /**
     * Constructor
     *
     * @param string $table
     * @param AdapterInterface $adapter
     * @param Feature\AbstractFeature|Feature\FeatureSet|Feature\AbstractFeature[] $features
     * @param ResultSetInterface $resultSetPrototype
     * @param Sql $sql
     *
     * @throws \InvalidArgumentException
     */
    public function __construct($table, AdapterInterface $adapter, $features = null, ResultSetInterface $resultSetPrototype = null, Sql $sql = null, $primaryKeyName = null)
    {
        if ($features !== null) {
            if ($features instanceof Feature\AbstractFeature) {
                $features = [$features];
            }
            if (is_array($features)) {
                $this->featureSet = new Feature\FeatureSet($features);
            } elseif ($features instanceof Feature\FeatureSet) {
                $this->featureSet = $features;
            } else {
                throw new \InvalidArgumentException(
                    'TableGateway expects $feature to be an instance of an AbstractFeature or a FeatureSet, or an array of AbstractFeatures'
                );
            }
        } else {
            $this->featureSet = new Feature\FeatureSet();
        }

        if ($primaryKeyName !== null) {
            $this->primaryKeyFieldName = $primaryKeyName;
        } else {
            $tablePrimaryKey = TableSchema::getTablePrimaryKey($table);
            if ($tablePrimaryKey) {
                $this->primaryKeyFieldName = $tablePrimaryKey;
            }
        }

        $rowGatewayPrototype = new BaseRowGateway($this->primaryKeyFieldName, $table, $adapter);
        $rowGatewayFeature = new RowGatewayFeature($rowGatewayPrototype);
        $this->featureSet->addFeature($rowGatewayFeature);
        $this->memcache = new MemcacheProvider();

        parent::__construct($table, $adapter, $this->featureSet, $resultSetPrototype, $sql);
    }

    /**
     * Static Factory Methods
     */

    /**
     * Underscore to camelcase table name to namespaced table gateway classname,
     * e.g. directus_users => \Directus\Db\TableGateway\DirectusUsersTableGateway
     */
//    public static function makeTableGatewayFromTableName($acl, $table, $adapter)
//    {
//        $tableGatewayClassName = Formatting::underscoreToCamelCase($table) . 'TableGateway';
//        $tableGatewayClassName = __NAMESPACE__ . '\\' . $tableGatewayClassName;
//        if (class_exists($tableGatewayClassName)) {
//            return new $tableGatewayClassName($adapter);
//        }
//        return new self($table, $adapter);
//    }

    /**
     * HELPER FUNCTIONS
     */

    /**
     * Make a new table gateway
     *
     * @param $tableName
     *
     * @return BaseTableGateway
     */
    public function makeTable($tableName)
    {
        return new self($tableName, $this->adapter);
    }

    /**
     * Find the identifying string to effectively represent a record in the activity log.
     * @param  array $schemaArray
     * @param  array|AclAwareRowGateway $fullRecordData
     * @return string
     */
    public function findRecordIdentifier($schemaArray, $fullRecordData)
    {
        // Decide on the correct column name
        $identifierColumnName = null;
        $column = TableSchema::getFirstNonSystemColumn($schemaArray);
        if ($column) {
            $identifierColumnName = $column['column_name'];
        }

        // Yield the column contents
        $identifier = null;
        if (isset($fullRecordData[$identifierColumnName])) {
            $identifier = $fullRecordData[$identifierColumnName];
        }

        return $identifier;
    }

    public function withKey($key, $resultSet)
    {
        $withKey = [];
        foreach ($resultSet as $row) {
            $withKey[$row[$key]] = $row;
        }
        return $withKey;
    }

    protected function convertResultSetDateTimesTimeZones(array $resultSet, $targetTimeZone, $fields = ['datetime'], $yieldObjects = false)
    {
        foreach ($resultSet as &$result) {
            $result = $this->convertRowDateTimesToTimeZone($result, $targetTimeZone, $fields);
        }
        return $resultSet;
    }

    protected function convertRowDateTimesToTimeZone(array $row, $targetTimeZone, $fields = ['datetime'], $yieldObjects = false)
    {
        foreach ($fields as $field) {
            $col =& $row[$field];
            $datetime = DateUtils::convertUtcDateTimeToTimeZone($col, $targetTimeZone);
            $col = $yieldObjects ? $datetime : $datetime->format('Y-m-d H:i:s T');
        }
        return $row;
    }

    public function newRow($table = null, $pk_field_name = null)
    {
        $table = is_null($table) ? $this->table : $table;
        $pk_field_name = is_null($pk_field_name) ? $this->primaryKeyFieldName : $pk_field_name;
        $row = new BaseRowGateway($pk_field_name, $table, $this->adapter);
        return $row;
    }

    public function find($id, $pk_field_name = null)
    {
        if ($pk_field_name == null) {
            $pk_field_name = $this->primaryKeyFieldName;
        }

        $record = $this->findOneBy($pk_field_name, $id);

        return $record;
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
        $rowset = $this->select(function (Select $select) use ($field, $value) {
            $select->limit(1);
            $select->where->equalTo($field, $value);
        }, ['filter' => false]);

        $row = $rowset->current();

        // Supposing this "one" doesn't exist in the DB
        if (false === $row) {
            return false;
        }

        return $row->toArray();
    }

    public function findOneByArray(array $data)
    {
        $rowset = $this->select($data);

        $row = $rowset->current();
        // Supposing this "one" doesn't exist in the DB
        if (false === $row) {
            return false;
        }
        $row = $row->toArray();
        return $row;
    }

    public function addOrUpdateRecordByArray(array $recordData, $tableName = null)
    {
        $tableName = is_null($tableName) ? $this->table : $tableName;
        foreach ($recordData as $columnName => $columnValue) {
            if (is_array($columnValue)) {
                // $table = is_null($tableName) ? $this->table : $tableName;
                throw new SuppliedArrayAsColumnValue('Attempting to write an array as the value for column `' . $tableName . '`.`' . $columnName . '.');
            }
        }

        $columns = TableSchema::getAllNonAliasTableColumns($tableName);
        $recordData = SchemaManager::parseRecordValuesByType($recordData, $columns);

        $TableGateway = $this->makeTable($tableName);
        $rowExists = isset($recordData[$TableGateway->primaryKeyFieldName]);
        if ($rowExists) {
            $Update = new Update($tableName);
            $Update->set($recordData);
            $Update->where([$TableGateway->primaryKeyFieldName => $recordData[$TableGateway->primaryKeyFieldName]]);
            $TableGateway->updateWith($Update);

            $this->runHook('postUpdate', [$TableGateway, $recordData, $this->adapter, null]);
        } else {
            $d = $this->applyHook('table.insert:before', [$tableName, $recordData]);
            $TableGateway->insert($d);
            $recordData[$TableGateway->primaryKeyFieldName] = $TableGateway->getLastInsertValue();

            if ($tableName == 'directus_files') {
                $Files = Bootstrap::get('app')->container->get('files');
                $ext = pathinfo($recordData['name'], PATHINFO_EXTENSION);

                $thumbnailPath = 'thumbs/THUMB_' . $recordData['name'];
                if ($Files->exists($thumbnailPath)) {
                    $Files->rename($thumbnailPath, 'thumbs/' . $recordData[$this->primaryKeyFieldName] . '.' . $ext);
                }

                $updateArray = [];
                if ($Files->getSettings('file_naming') == 'file_id') {
                    $Files->rename($recordData['name'], str_pad($recordData[$this->primaryKeyFieldName], 11, '0', STR_PAD_LEFT) . '.' . $ext);
                    $updateArray['name'] = str_pad($recordData[$this->primaryKeyFieldName], 11, '0', STR_PAD_LEFT) . '.' . $ext;
                    $recordData['name'] = $updateArray['name'];
                }

                if (!empty($updateArray)) {
                    $Update = new Update($tableName);
                    $Update->set($updateArray);
                    $Update->where([$TableGateway->primaryKeyFieldName => $recordData[$TableGateway->primaryKeyFieldName]]);
                    $TableGateway->updateWith($Update);
                }
            }

            $this->runHook('postInsert', [$TableGateway, $recordData, $this->adapter, null]);
        }

        $columns = TableSchema::getAllNonAliasTableColumnNames($tableName);
        $recordData = $TableGateway->fetchAll(function ($select) use ($recordData, $columns, $TableGateway) {
            $select
                ->columns($columns)
                ->limit(1);
            $select->where->equalTo($TableGateway->primaryKeyFieldName, $recordData[$TableGateway->primaryKeyFieldName]);
        })->current();

        return $recordData;
    }

    public function drop($tableName = null)
    {
        if ($tableName == null) {
            $tableName = $this->table;
        }

        if (!TableSchema::getTable($tableName)) {
            return false;
        }

        // get drop table query
        $sql = new Sql($this->adapter);
        $drop = new Ddl\DropTable($tableName);
        $query = $sql->getSqlStringForSqlObject($drop);

        $this->runHook('table.drop:before', [$tableName]);

        $dropped = $this->adapter->query(
            $query
        )->execute();

        if (!$dropped) {
            return false;
        }

        $this->runHook('table.drop', [$tableName]);
        $this->runHook('table.drop:after', [$tableName]);

        // remove table privileges
        if ($tableName != 'directus_privileges') {
            $privilegesTableGateway = new TableGateway('directus_privileges', $this->adapter);
            $privilegesTableGateway->delete(['table_name' => $tableName]);
        }

        // remove column from directus_tables
        $tablesTableGateway = new TableGateway('directus_tables', $this->adapter);
        $tablesTableGateway->delete([
            'table_name' => $tableName
        ]);

        // remove column from directus_preferences
        $preferencesTableGateway = new TableGateway('directus_preferences', $this->adapter);
        $preferencesTableGateway->delete([
            'table_name' => $tableName
        ]);

        return $dropped;
    }

    public function dropColumn($columnName, $tableName = null)
    {
        if ($tableName == null) {
            $tableName = $this->table;
        }

        if (!TableSchema::hasTableColumn($tableName, $columnName, true)) {
            return false;
        }

        // Drop table column if is a non-alias column
        if (!array_key_exists($columnName, array_flip(TableSchema::getAllAliasTableColumns($tableName, true)))) {
            $sql = new Sql($this->adapter);
            $alterTable = new Ddl\AlterTable($tableName);
            $dropColumn = $alterTable->dropColumn($columnName);
            $query = $sql->getSqlStringForSqlObject($dropColumn);

            $this->adapter->query(
                $query
            )->execute();
        }

        // Remove column from directus_columns
        $columnsTableGateway = new TableGateway('directus_columns', $this->adapter);
        $columnsTableGateway->delete([
            'table_name' => $tableName,
            'column_name' => $columnName
        ]);

        // Remove column from directus_ui
        $uisTableGateway = new TableGateway('directus_ui', $this->adapter);
        $uisTableGateway->delete([
            'table_name' => $tableName,
            'column_name' => $columnName
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

        if (in_array($relationshipType, $directus_types)) {
            //This is a 'virtual column'. Write to directus schema instead of MYSQL
            $this->addVirtualColumn($tableName, $tableData);
        } else {
            $this->addTableColumn($tableName, $tableData);
            // Temporary solutions to #481, #645
            if (array_key_exists('ui', $tableData) && in_array($tableData['ui'], $manytoones)) {
                $tableData['relationship_type'] = 'MANYTOONE';
                $tableData['junction_key_right'] = $tableData['column_name'];
            }

            $this->addVirtualColumn($tableName, $tableData);
        }

        return $tableData['column_name'];
    }

    protected function addTableColumn($tableName, $columnData)
    {
        $column_name = $columnData['column_name'];
        $data_type = $columnData['data_type'];
        $comment = ArrayUtils::get($columnData, 'comment', '');

        if (array_key_exists('char_length', $columnData)) {
            $charLength = $columnData['char_length'];
            // SET and ENUM data type has its values in the char_length attribute
            // each value are separated by commas
            // it must be wrap into quotes
            if (strpos($charLength, ',') !== false) {
                $charLength = implode(',', array_map(function ($value) {
                    return '"' . trim($value) . '"';
                }, explode(',', $charLength)));
            }

            $data_type = $data_type . '(' . $charLength . ')';
        }

        // TODO: wrap this into an abstract DDL class
        $sql = 'ALTER TABLE `' . $tableName . '` ADD COLUMN `' . $column_name . '` ' . $data_type . ' COMMENT "' . $comment . '"';

        $this->adapter->query($sql)->execute();
    }

    protected function addVirtualColumn($tableName, $columnData)
    {
        $alias_columns = ['table_name', 'column_name', 'data_type', 'related_table', 'junction_table', 'junction_key_left', 'junction_key_right', 'sort', 'ui', 'comment', 'relationship_type'];

        $columnData['table_name'] = $tableName;
        $columnData['sort'] = 9999;

        $data = array_intersect_key($columnData, array_flip($alias_columns));
        return $this->addOrUpdateRecordByArray($data, 'directus_columns');
    }

    protected function logger()
    {
        return Bootstrap::get('app')->getLog();
    }

    public function castFloatIfNumeric(&$value, $key)
    {
        if ($key != 'table_name') {
            $value = is_numeric($value) ? (float)$value : $value;
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

    /**
     * Extract unescaped & unprefixed column names
     * @param  array $columns Optionally escaped or table-prefixed column names, e.g. drawn from
     * \Zend\Db\Sql\Insert|\Zend\Db\Sql\Update#getRawState
     * @return array
     */
    protected function extractRawColumnNames($columns)
    {
        // @TODO: fix this method
        $columnNames = [];
        foreach ($insertState['columns'] as $column) {
            $sansSpaces = preg_replace('/\s/', '', $column);
            preg_match('/(\W?\w+\W?\.)?\W?([\*\w+])\W?/', $sansSpaces, $matches);
            if (isset($matches[2])) {
                $columnNames[] = $matches[2];
            }
        }
        return $columnNames;
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

    public function convertDates(array $records, array $schemaArray, $tableName = null)
    {
        $tableName = $tableName === null ? $this->table : $tableName;
        if (!SchemaManager::isDirectusTable($tableName)) {
            return $records;
        }

        // ==========================================================================
        // hotfix: records sometimes are no set as an array of rows.
        // NOTE: this code is duplicate @see: AbstractSchema::parseRecordValuesByType
        // ==========================================================================
        $singleRecord = false;
        if (!is_numeric_keys_array($records)) {
            $records = [$records];
            $singleRecord = true;
        }

        foreach ($records as $index => $row) {
            foreach ($schemaArray as $column) {
                if (in_array(strtolower($column['type']), ['timestamp', 'datetime'])) {
                    $columnName = $column['id'];
                    if (array_key_exists($columnName, $row)) {
                        $records[$index][$columnName] = DateUtils::convertToISOFormat($row[$columnName], 'UTC', get_user_timezone());
                    }
                }
            }
        }

        return $singleRecord ? reset($records) : $records;
    }

    protected function parseRecordValuesByType(array $records, $tableName = null)
    {
        $tableName = $tableName === null ? $this->table : $tableName;
        $columns = TableSchema::getAllNonAliasTableColumns($tableName);

        return SchemaManager::parseRecordValuesByType($records, $columns);
    }

    public function parseRecord($records, $tableName = null)
    {
        if (is_array($records)) {
            $tableName = $tableName === null ? $this->table : $tableName;
            $records = $this->parseRecordValuesByType($records, $tableName);
            $columns = TableSchema::getAllNonAliasTableColumns($tableName);
            $records = $this->convertDates($records, $columns, $tableName);
        }

        return $records;
    }

    /**
     * Select
     *
     * @param Where|\Closure|string|array $where
     *
     * @return ResultSetInterface
     */
    public function select($where = null)
    {
        if (!$this->isInitialized) {
            $this->initialize();
        }

        $select = $this->sql->select();

        if ($where instanceof \Closure) {
            $where($select);
        } elseif ($where !== null) {
            $select->where($where);
        }

        return $this->selectWith($select, ArrayUtils::get(func_get_args(), 1, []));
    }

    /**
     * @param Select $select
     *
     * @return null|ResultSetInterface
     *
     * @throws \RuntimeException
     */
    public function selectWith(Select $select)
    {
        if (!$this->isInitialized) {
            $this->initialize();
        }

        return $this->executeSelect($select, ArrayUtils::get(func_get_args(), 1, []));
    }

    protected function executeSelect(Select $select)
    {
        $selectState = $select->getRawState();
        $result = parent::executeSelect($select);
        $options = ArrayUtils::get(func_get_args(), 1, []);

        if (!is_array($options)) {
            $options = [];
        }

        if (ArrayUtils::get($options, 'filter', true) !== false) {
            $payload = (object)[
                'result' => $result,
                'selectState' => $selectState,
                'options' => $options
            ];

            $payload = $this->applyHook('table.select', $payload);
            $payload = $this->applyHook('table.' . $selectState['table'] . '.select', $payload);

            $result = $payload->result;
        }

        return $result;
    }

    public static function setHookEmitter($emitter)
    {
        static::$emitter = $emitter;
    }

    public function runHook($name, $data = null)
    {
        if (static::$emitter) {
            static::$emitter->execute($name, $data);
        }
    }

    public function applyHook($name, $data = null)
    {
        if (static::$emitter) {
            $data = static::$emitter->apply($name, $data);
        }

        return $data;
    }
}
