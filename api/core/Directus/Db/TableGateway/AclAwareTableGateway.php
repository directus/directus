<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Acl\Exception\UnauthorizedTableAddException;
use Directus\Acl\Exception\UnauthorizedTableBigDeleteException;
use Directus\Acl\Exception\UnauthorizedTableBigEditException;
use Directus\Acl\Exception\UnauthorizedTableDeleteException;
use Directus\Acl\Exception\UnauthorizedTableEditException;
use Directus\Auth\Provider as Auth;
use Directus\Bootstrap;
use Directus\Db\Exception\SuppliedArrayAsColumnValue;
use Directus\Db\Exception\DuplicateEntryException;
use Directus\Db\RowGateway\AclAwareRowGateway;
use Directus\Db\SchemaManager;
use Directus\Db\TableSchema;
use Directus\Files\Files;
use Directus\Hook\Hook;
use Directus\Util\ArrayUtils;
use Directus\Util\DateUtils;
use Directus\Util\Formatting;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\ResultSet\ResultSet;
use Zend\Db\Sql\AbstractSql;
use Zend\Db\Sql\Ddl;
use Zend\Db\Sql\Delete;
use Zend\Db\Sql\Insert;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Update;
use Zend\Db\Sql\Where;
use Zend\Db\TableGateway\TableGateway;
use Zend\Db\TableGateway\Feature;
use Zend\Db\TableGateway\Feature\RowGatewayFeature;
use Directus\MemcacheProvider;

class AclAwareTableGateway extends TableGateway {

    protected $acl;

    public $primaryKeyFieldName = 'id';
    public $imagickExtensions = array('tiff', 'tif', 'psd', 'pdf');
    public $memcache;

    /**
     * Hook Emitter Instance
     *
     * @var \Directus\Hook\Emitter
     */
    protected $emitter;

    /**
     * Constructor
     *
     * @param AclProvider $acl
     * @param string $table
     * @param AdapterInterface $adapter
     * @param Feature\AbstractFeature|Feature\FeatureSet|Feature\AbstractFeature[] $features
     * @param ResultSetInterface $resultSetPrototype
     * @param Sql $sql
     * @throws Exception\InvalidArgumentException
     */
    public function __construct(Acl $acl, $table, AdapterInterface $adapter, $features = null, ResultSetInterface $resultSetPrototype = null, Sql $sql = null, $primaryKeyName = null)
    {
        $this->acl = $acl;

        if ($features !== null) {
            if ($features instanceof Feature\AbstractFeature) {
                $features = array($features);
            }
            if (is_array($features)) {
                $this->featureSet = new Feature\FeatureSet($features);
            } elseif ($features instanceof Feature\FeatureSet) {
                $this->featureSet = $features;
            } else {
                throw new Exception\InvalidArgumentException(
                    'TableGateway expects $feature to be an instance of an AbstractFeature or a FeatureSet, or an array of AbstractFeatures'
                );
            }
        } else {
            $this->featureSet = new Feature\FeatureSet();
        }

        if($primaryKeyName !== null) {
            $this->primaryKeyFieldName = $primaryKeyName;
        } else {
            $tablePrimaryKey = TableSchema::getTablePrimaryKey($table);
            if ($tablePrimaryKey) {
                $this->primaryKeyFieldName = $tablePrimaryKey;
            }
        }

        $rowGatewayPrototype = new AclAwareRowGateway($acl, $this->primaryKeyFieldName, $table, $adapter);
        $rowGatewayFeature = new RowGatewayFeature($rowGatewayPrototype);
        $this->featureSet->addFeature($rowGatewayFeature);
        $this->memcache = new MemcacheProvider();
        $this->emitter = Bootstrap::get('hookEmitter');

        parent::__construct($table, $adapter, $this->featureSet, $resultSetPrototype, $sql);
    }

    /**
     * Static Factory Methods
     */

    /**
     * Underscore to camelcase table name to namespaced table gateway classname,
     * e.g. directus_users => \Directus\Db\TableGateway\DirectusUsersTableGateway
     */
    public static function makeTableGatewayFromTableName($acl, $table, $adapter) {
        $tableGatewayClassName = Formatting::underscoreToCamelCase($table) . "TableGateway";
        $tableGatewayClassName = __NAMESPACE__ . "\\$tableGatewayClassName";
        if(class_exists($tableGatewayClassName)) {
            return new $tableGatewayClassName($acl, $adapter);
        }
        return new self($acl, $table, $adapter);
    }

    /**
     * HELPER FUNCTIONS
     */

    public function withKey($key, $resultSet) {
        $withKey = array();
        foreach($resultSet as $row) {
            $withKey[$row[$key]] = $row;
        }
        return $withKey;
    }

    protected function convertResultSetDateTimesTimeZones(array $resultSet, $targetTimeZone, $fields = array('datetime'), $yieldObjects = false) {
        foreach($resultSet as &$result) {
            $result = $this->convertRowDateTimesToTimeZone($result, $targetTimeZone, $fields);
        }
        return $resultSet;
    }

    protected function convertRowDateTimesToTimeZone(array $row, $targetTimeZone, $fields = array('datetime'), $yieldObjects = false) {
        foreach($fields as $field) {
            $col =& $row[$field];
            $datetime = DateUtils::convertUtcDateTimeToTimeZone($col, $targetTimeZone);
            $col = $yieldObjects ? $datetime : $datetime->format("Y-m-d H:i:s T");
        }
        return $row;
    }

    public function newRow($table = null, $pk_field_name = null)
    {
        $table = is_null($table) ? $this->table : $table;
        $pk_field_name = is_null($pk_field_name) ? $this->primaryKeyFieldName : $pk_field_name;
        $row = new AclAwareRowGateway($this->acl, $pk_field_name, $table, $this->adapter);
        return $row;
    }

    public function find($id, $pk_field_name = null) {
        if ($pk_field_name == null) {
            $pk_field_name = $this->primaryKeyFieldName;
        }
        $record = $this->findOneBy($pk_field_name, $id);
        return $record;
    }

    public function fetchAll($selectModifier = null) {
        return $this->select(function(Select $select) use ($selectModifier) {
            if(is_callable($selectModifier)) {
                $selectModifier($select);
            }
        });
    }

    /**
     * @return array All rows in array form with record IDs for the array's keys.
     */
    public function fetchAllWithIdKeys($selectModifier = null) {
        $allWithIdKeys = array();
        $all = $this->fetchAll($selectModifier)->toArray();
        return $this->withKey('id', $all);
    }

    public function findOneBy($field, $value) {
        $rowset = $this->select(function(Select $select) use ($field, $value) {
            $select->limit(1);
            $select->where->equalTo($field, $value);
        });
        $row = $rowset->current();
        // Supposing this "one" doesn't exist in the DB
        if(false === $row) {
            return false;
        }
        $row = $row->toArray();
        return $row;
    }

    public function findOneByArray(array $data) {
        $rowset = $this->select($data);

        $row = $rowset->current();
        // Supposing this "one" doesn't exist in the DB
        if(false === $row) {
            return false;
        }
        $row = $row->toArray();
        return $row;
    }

    public function addOrUpdateRecordByArray(array $recordData, $tableName = null) {
        $tableName = is_null($tableName) ? $this->table : $tableName;
        foreach($recordData as $columnName => $columnValue) {
            if(is_array($columnValue)) {
                // $table = is_null($tableName) ? $this->table : $tableName;
                throw new SuppliedArrayAsColumnValue("Attempting to write an array as the value for column `$tableName`.`$columnName`.");
            }
        }

        $columns = TableSchema::getAllNonAliasTableColumns($tableName);
        $recordData = SchemaManager::parseRecordValuesByType($recordData, $columns);

        $TableGateway = new self($this->acl, $tableName, $this->adapter);
        $rowExists = isset($recordData[$TableGateway->primaryKeyFieldName]);
        if($rowExists) {
            $Update = new Update($tableName);
            $Update->set($recordData);
            $Update->where(array($TableGateway->primaryKeyFieldName => $recordData[$TableGateway->primaryKeyFieldName]));
            $TableGateway->updateWith($Update);

            $this->emitter->run('postUpdate', [$TableGateway, $recordData, $this->adapter, $this->acl]);
        } else {
            $d = $recordData;
            unset($d['data']);
            if ($tableName == 'directus_files') {
                $d['user'] = Auth::getUserInfo('id');
            }
            $TableGateway->insert($d);
            $recordData[$TableGateway->primaryKeyFieldName] = $TableGateway->getLastInsertValue();

            if($tableName == "directus_files") {
              $Files = new \Directus\Files\Files();
              $ext = pathinfo($recordData['name'], PATHINFO_EXTENSION);

              $thumbnailPath = 'thumbs/THUMB_' . $recordData['name'];
              if ($Files->exists($thumbnailPath)) {
                $Files->rename($thumbnailPath, 'thumbs/' . $recordData[$this->primaryKeyFieldName] . '.' . $ext);
              }

              $updateArray = array();
              if ($Files->getSettings('file_naming') == 'file_id') {
                $Files->rename($recordData['name'], str_pad($recordData[$this->primaryKeyFieldName],11,"0", STR_PAD_LEFT).'.'.$ext);
                $updateArray['name'] = str_pad($recordData[$this->primaryKeyFieldName],11,"0", STR_PAD_LEFT).'.'.$ext;
                $recordData['name'] = $updateArray['name'];
              }

              if(!empty($updateArray)) {
                $Update = new Update($tableName);
                $Update->set($updateArray);
                $Update->where(array($TableGateway->primaryKeyFieldName => $recordData[$TableGateway->primaryKeyFieldName]));
                $TableGateway->updateWith($Update);
              }
            }

            $this->emitter->run('postInsert', [$TableGateway, $recordData, $this->adapter, $this->acl]);
        }

        $columns = TableSchema::getAllNonAliasTableColumnNames($tableName);
        $recordData = $TableGateway->fetchAll(function($select) use ($recordData, $columns, $TableGateway) {
            $select
                ->columns($columns)
                ->limit(1);
            $select->where->equalTo($TableGateway->primaryKeyFieldName, $recordData[$TableGateway->primaryKeyFieldName]);
        })->current();

        return $recordData;
    }

    public function drop($tableName = null) {
        if ($tableName == null) {
            $tableName = $this->table;
        }

        if (!\Directus\Db\TableSchema::getTable($tableName)) {
            return false;
        }

        if (!$this->acl->hasTablePrivilege($tableName, 'alter')) {
            $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
            throw new UnauthorizedTableAddException($aclErrorPrefix . "Table alter access forbidden on table $tableName");
        }

        // get drop table query
        $sql = new Sql($this->adapter);
        $drop = new Ddl\DropTable($tableName);
        $query = $sql->getSqlStringForSqlObject($drop);

        $this->emitter->run('table.drop:before', [$tableName]);

        $dropped = $this->adapter->query(
            $query
        )->execute();

        if (!$dropped) {
            return false;
        }

        $this->emitter->run('table.drop', [$tableName]);
        $this->emitter->run('table.drop:after', [$tableName]);

        // remove table privileges
        if ($tableName != 'directus_privileges') {
            $privilegesTableGateway = new TableGateway('directus_privileges', $this->adapter);
            $privilegesTableGateway->delete(array('table_name' => $tableName));
        }

        // remove column from directus_tables
        $tablesTableGateway = new TableGateway('directus_tables', $this->adapter);
        $tablesTableGateway->delete(array(
            'table_name' => $tableName
        ));

        // remove column from directus_preferences
        $preferencesTableGateway = new TableGateway('directus_preferences', $this->adapter);
        $preferencesTableGateway->delete(array(
            'table_name' => $tableName
        ));

        return $dropped;
    }

    public function dropColumn($columnName, $tableName = null) {
        if ($tableName == null) {
            $tableName = $this->table;
        }

        if (!TableSchema::hasTableColumn($tableName, $columnName, true)) {
            return false;
        }

        if (!$this->acl->hasTablePrivilege($tableName, 'alter')) {
            $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
            throw new UnauthorizedTableAddException($aclErrorPrefix . "Table alter access forbidden on table $tableName");
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
        $columnsTableGateway->delete(array(
            'table_name' => $tableName,
            'column_name' => $columnName
        ));

        // Remove column from directus_ui
        $uisTableGateway = new TableGateway('directus_ui', $this->adapter);
        $uisTableGateway->delete(array(
            'table_name' => $tableName,
            'column_name' => $columnName
        ));

        return true;
    }

    /*
      Temporary solutions to fix add column error
        This add column is the same old-db add_column method
    */
    public function addColumn($tableName, $tableData) {
      $directus_types = array('MANYTOMANY', 'ONETOMANY', 'ALIAS');
      $relationshipType = ArrayUtils::get($tableData, 'relationship_type', null);
      // TODO: list all types which need manytoone ui
      // Hard-coded
      $manytoones = array('single_file', 'many_to_one', 'many_to_one_typeahead', 'MANYTOONE');

      if (in_array($relationshipType, $directus_types)) {
          //This is a 'virtual column'. Write to directus schema instead of MYSQL
          $this->addVirtualColumn($tableName, $tableData);
      } else {
          $this->addTableColumn($tableName, $tableData);
          // Temporary solutions to #481, #645
          if(array_key_exists('ui', $tableData) && in_array($tableData['ui'], $manytoones)) {
            $tableData['relationship_type'] = 'MANYTOONE';
            $tableData['junction_key_right'] = $tableData['column_name'];
          }

          $this->addVirtualColumn($tableName, $tableData);
      }

      return $tableData['column_name'];
    }

    protected function addTableColumn($tableName, $columnData) {
      $column_name = $columnData['column_name'];
      $data_type = $columnData['data_type'];
      $comment = $columnData['comment'];

      if (array_key_exists('char_length', $columnData)) {
          $charLength = $columnData['char_length'];
          // SET and ENUM data type has its values in the char_length attribute
          // each value are separated by commas
          // it must be wrap into quotes
          if (strpos($charLength, ',') !== false) {
              $charLength = implode(',', array_map(function($value) {
                  return "'". trim($value) . "'";
              }, explode(',', $charLength)));
          }

          $data_type = $data_type.'('.$charLength.')';
      }

      // TODO: wrap this into an abstract DDL class
      $sql = "ALTER TABLE `$tableName` ADD COLUMN `$column_name` $data_type COMMENT '$comment'";

      $this->adapter->query( $sql )->execute();
    }

    protected function addVirtualColumn($tableName, $columnData) {
      $alias_columns = array('table_name', 'column_name', 'data_type', 'related_table', 'junction_table', 'junction_key_left','junction_key_right', 'sort', 'ui', 'comment', 'relationship_type');

      $columnData['table_name'] = $tableName;
      $columnData['sort'] = 9999;

      $data = array_intersect_key($columnData, array_flip($alias_columns));
      return $this->addOrUpdateRecordByArray($data, 'directus_columns');
    }

    protected function logger() {
        return Bootstrap::get('app')->getLog();
    }

    public function castFloatIfNumeric(&$value, $key) {
        if ($key != 'table_name') {
            $value = is_numeric($value) ? (float) $value : $value;
        }
    }

    /**
     * Convenience method for dumping a ZendDb Sql query object as debug output.
     * @param  AbstractSql $query
     * @return null
     */
    public function dumpSql(AbstractSql $query) {
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
    protected function extractRawColumnNames($columns) {
        $columnNames = array();
        foreach ($insertState['columns'] as $column) {
            $sansSpaces = preg_replace('/\s/', '', $column);
            preg_match('/(\W?\w+\W?\.)?\W?([\*\w+])\W?/', $sansSpaces, $matches);
            if(isset($matches[2])) {
                $columnNames[] = $matches[2];
            }
        }
        return $columnNames;
    }

    protected function getRawTableNameFromQueryStateTable($table) {
        if(is_string($table)) {
            return $table;
        }
        if(is_array($table)) {
            // The only value is the real table name (key is alias).
            return array_pop($table);
        }
        throw new \InvalidArgumentException("Unexpected parameter of type " . get_class($table));
    }

    /**
     * Post select process
     * @param array $selectState
     * @param ResultSet $result
     * @return ResultSet
     */
    protected function processSelect($selectState, $result)
    {
        // Add file url and thumb url
        if ($selectState['table'] == 'directus_files') {
            $fileRows = $result->toArray();
            $files = new Files();
            foreach ($fileRows as &$row) {
                $config = Bootstrap::get('config');
                $fileURL = $config['filesystem']['root_url'];
                $thumbnailURL = $config['filesystem']['root_thumb_url'];
                $thumbnailFilenameParts = explode('.', $row['name']);
                $thumbnailExtension = array_pop($thumbnailFilenameParts);

                $row['url'] = $fileURL . '/' . $row['name'];
                if (in_array($thumbnailExtension, ['tif', 'tiff', 'psd', 'pdf'])) {
                    $thumbnailExtension = 'jpg';
                }

                $thumbnailFilename = $row['id'] . '.' . $thumbnailExtension;
                $row['thumbnail_url'] = $thumbnailURL . '/' . $thumbnailFilename;
                // hotfix: there's not thumbnail for this file
                if (!$files->exists('thumbs/' . $thumbnailFilename)) {
                    $row['thumbnail_url'] = null;
                }

                $embedManager = Bootstrap::get('embedManager');
                $provider = $embedManager->getByType($row['type']);
                $row['html'] = null;
                if ($provider) {
                    $row['html'] = $provider->getCode($row);
                }
            }

            $filesArrayObject = new \ArrayObject($fileRows);
            $result->initialize($filesArrayObject->getIterator());
        }

        return $result;
    }

    /**
     * OVERRIDES
     */

    /**
     * @param Select $select
     * @return ResultSet
     * @throws \RuntimeException
     */
    protected function executeSelect(Select $select)
    {
        /**
         * ACL Enforcement
         */
        $selectState = $select->getRawState();
        $table = $this->getRawTableNameFromQueryStateTable($selectState['table']);

        // Enforce field read blacklist on Select's main table
        try {
            // @TODO: Enforce must return a list of columns without the blacklist
            // when asterisk (*) is used
            // and only throw and error when all the selected columns are blacklisted
            $this->acl->enforceBlacklist($table, $selectState['columns'], Acl::FIELD_READ_BLACKLIST);
        } catch (\Exception $e) {
            if ($selectState['columns'][0] != '*') {
                throw $e;
            }

            $selectState['columns'] = TableSchema::getAllNonAliasTableColumns($table);
            $this->acl->enforceBlacklist($table, $selectState['columns'], Acl::FIELD_READ_BLACKLIST);
        }

        // Enforce field read blacklist on Select's join tables
        foreach($selectState['joins'] as $join) {
            $joinTable = $this->getRawTableNameFromQueryStateTable($join['name']);
            $this->acl->enforceBlacklist($joinTable, $join['columns'], Acl::FIELD_READ_BLACKLIST);
        }

        try {
            return $this->processSelect($selectState, parent::executeSelect($select));
        } catch(\Zend\Db\Adapter\Exception\InvalidQueryException $e) {
            if('production' !== DIRECTUS_ENV) {
                throw new \RuntimeException("This query failed: " . $this->dumpSql($select), 0, $e);
            }
            // @todo send developer warning
            throw $e;
        }
    }

    /**
     * @param Insert $insert
     * @return mixed
     * @throws \Directus\Acl\Exception\UnauthorizedTableAddException
     * @throws \Directus\Acl\Exception\UnauthorizedFieldWriteException
     */
    protected function executeInsert(Insert $insert)
    {
        /**
         * ACL Enforcement
         */

        $insertState = $insert->getRawState();
        $insertTable = $this->getRawTableNameFromQueryStateTable($insertState['table']);
        $insertData = $insertState['values'];

        if (!$this->acl->hasTablePrivilege($insertTable, 'add')) {
            $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
            throw new UnauthorizedTableAddException($aclErrorPrefix . "Table add access forbidden on table $insertTable");
        }

        // Enforce write field blacklist
        $this->acl->enforceBlacklist($insertTable, $insertState['columns'], Acl::FIELD_WRITE_BLACKLIST);

        try {
            // Data to be inserted with the column name as assoc key.
            $insertDataAssoc = array_combine($insertState['columns'], $insertData);

            $this->emitter->run('table.insert:before', [$insertTable, $insertDataAssoc]);
            $this->emitter->run('table.insert.' . $insertTable . ':before', [$insertDataAssoc]);

            $result = parent::executeInsert($insert);
            $insertTableGateway = new self($this->acl, $insertTable, $this->adapter);
            $resultData = $insertTableGateway->find($this->getLastInsertValue());

            $this->emitter->run('table.insert', [$insertTable, $resultData]);
            $this->emitter->run('table.insert.' . $insertTable, [$resultData]);
            $this->emitter->run('table.insert:after', [$insertTable, $resultData]);
            $this->emitter->run('table.insert.' . $insertTable . ':after', [$resultData]);

            return $result;
        } catch(\Zend\Db\Adapter\Exception\InvalidQueryException $e) {
            // @todo send developer warning
            if (strpos(strtolower($e->getMessage()), 'duplicate entry')!==FALSE) {
                throw new DuplicateEntryException($e->getMessage());
            }

            if('production' !== DIRECTUS_ENV) {
                throw new \RuntimeException("This query failed: " . $this->dumpSql($insert), 0, $e);
            }

            throw $e;
        }
    }

    /**
     * @param Update $update
     * @return mixed
     * @throws Exception\RuntimeException
     * @throws \Directus\Acl\Exception\UnauthorizedFieldWriteException
     * @throws \Directus\Acl\Exception\UnauthorizedTableBigEditException
     * @throws \Directus\Acl\Exception\UnauthorizedTableEditException
     */
    protected function executeUpdate(Update $update)
    {
        $currentUserId = null;
        if (Auth::loggedIn()) {
            $currentUser = Auth::getUserInfo();
            $currentUserId = intval($currentUser['id']);
        }

        $updateState = $update->getRawState();
        $updateTable = $this->getRawTableNameFromQueryStateTable($updateState['table']);
        $cmsOwnerColumn = $this->acl->getCmsOwnerColumnByTable($updateTable);
        $updateData = $updateState['set'];

        /**
         * ACL Enforcement
         */
        // check if it's NOT soft delete
        $updateFields = $updateState['set'];

        $permissionName = 'edit';
        $hasStatusColumn = array_key_exists(STATUS_COLUMN_NAME, $updateFields) ? true : false;
        if ($hasStatusColumn && $updateFields[STATUS_COLUMN_NAME] == STATUS_DELETED_NUM) {
            $permissionName = 'delete';
        }

        if (!$this->acl->hasTablePrivilege($updateTable, 'big' . $permissionName)) {
            // Parsing for the column name is unnecessary. Zend enforces raw column names.
            /**
             * Enforce Privilege: "Big" Edit
             */
            if (false === $cmsOwnerColumn) {
                // All edits are "big" edits if there is no magic owner column.
                $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
                throw new UnauthorizedTableBigEditException($aclErrorPrefix . "The table `$updateTable` is missing the `user_create_column` within `directus_tables` (BigEdit Permission Forbidden)");
            } else {
                // Who are the owners of these rows?
                list($resultQty, $ownerIds) = $this->acl->getCmsOwnerIdsByTableGatewayAndPredicate($this, $updateState['where']);
                // Enforce
                if (is_null($currentUserId) || count(array_diff($ownerIds, array($currentUserId)))) {
                    // $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
                    // throw new UnauthorizedTableBigEditException($aclErrorPrefix . "Table bigedit access forbidden on $resultQty `$updateTable` table record(s) and " . count($ownerIds) . " CMS owner(s) (with ids " . implode(", ", $ownerIds) . ").");
                    $groupsTableGateway = self::makeTableGatewayFromTableName($this->acl, 'directus_groups', $this->adapter);
                    $group = $groupsTableGateway->find($this->acl->getGroupId());
                    throw new UnauthorizedTableBigEditException("[{$group['name']}] permissions only allow you to [$permissionName] your own items.");
                }
            }
        }

        if (!$this->acl->hasTablePrivilege($updateTable, $permissionName)) {
            /**
             * Enforce Privilege: "Little" Edit (I am the record CMS owner)
             */
            if (false !== $cmsOwnerColumn) {
                if (!isset($predicateResultQty)) {
                    // Who are the owners of these rows?
                    list($predicateResultQty, $predicateOwnerIds) = $this->acl->getCmsOwnerIdsByTableGatewayAndPredicate($this, $updateState['where']);
                }

                if (in_array($currentUserId, $predicateOwnerIds)) {
                    $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
                    throw new UnauthorizedTableEditException($aclErrorPrefix . "Table edit access forbidden on $predicateResultQty `$updateTable` table records owned by the authenticated CMS user (#$currentUserId).");
                }
            }
        }

        // Enforce write field blacklist
        $attemptOffsets = array_keys($updateState['set']);
        $this->acl->enforceBlacklist($updateTable, $attemptOffsets, Acl::FIELD_WRITE_BLACKLIST);

        try {
            $this->emitter->run('table.update:before', [$updateTable, $updateData]);
            $this->emitter->run('table.update.' . $updateTable . ':before', [$updateData]);
            $result = parent::executeUpdate($update);
            $this->emitter->run('table.update', [$updateTable, $updateData]);
            $this->emitter->run('table.update:after', [$updateTable, $updateData]);
            $this->emitter->run('table.update.' . $updateTable, [$updateData]);
            $this->emitter->run('table.update.' . $updateTable . ':after', [$updateData]);

            return $result;
        } catch(\Zend\Db\Adapter\Exception\InvalidQueryException $e) {
            // @TODO: these lines are the same as the executeInsert,
            // let's put it together
            if (strpos(strtolower($e->getMessage()), 'duplicate entry')!==FALSE) {
                throw new DuplicateEntryException($e->getMessage());
            }

            if('production' !== DIRECTUS_ENV) {
                throw new \RuntimeException("This query failed: " . $this->dumpSql($update), 0, $e);
            }

            // @todo send developer warning
            throw $e;
        }
    }

    /**
     * @param Delete $delete
     * @return mixed
     * @throws Exception\RuntimeException
     * @throws \Directus\Acl\Exception\UnauthorizedTableBigDeleteException
     * @throws \Directus\Acl\Exception\UnauthorizedTableDeleteException
     */
    protected function executeDelete(Delete $delete)
    {
        $cuurrentUserId = null;
        if(Auth::loggedIn()) {
            $currentUser = Auth::getUserInfo();
            $currentUserId = intval($currentUser['id']);
        }
        $deleteState = $delete->getRawState();
        $deleteTable = $this->getRawTableNameFromQueryStateTable($deleteState['table']);
        $cmsOwnerColumn = $this->acl->getCmsOwnerColumnByTable($deleteTable);
        $canBigDelete = $this->acl->hasTablePrivilege($deleteTable, 'bigdelete');
        $canDelete = $this->acl->hasTablePrivilege($deleteTable, 'delete');
        $aclErrorPrefix = $this->acl->getErrorMessagePrefix();

        if (!TableSchema::hasTableColumn($deleteTable, STATUS_COLUMN_NAME)) {
          if ($this->acl->hasTablePrivilege($deleteTable, 'bigdelete')) {
            $canBigDelete = true;
          } else if ($this->acl->hasTablePrivilege($deleteTable, 'delete')) {
            $canDelete = true;
          }
        }

        // @todo: clean way
        if ($deleteTable === 'directus_bookmarks') {
          $canBigDelete = true;
        }

        /**
         * ACL Enforcement
         */

        if(!$canBigDelete && !$canDelete) {
          throw new UnauthorizedTableBigDeleteException($aclErrorPrefix . " forbidden to hard delete on table `$deleteTable` because it has Status Column.");
        }

        if (false === $cmsOwnerColumn) {
          // cannot delete if there's no magic owner column and can't big delete
          if (!$canBigDelete) {
            // All deletes are "big" deletes if there is no magic owner column.
            throw new UnauthorizedTableBigDeleteException($aclErrorPrefix . "The table `$deleteTable` is missing the `user_create_column` within `directus_tables` (BigHardDelete Permission Forbidden)");
          }
        } else {
          if(!$canBigDelete){
            // Who are the owners of these rows?
            list($predicateResultQty, $predicateOwnerIds) = $this->acl->getCmsOwnerIdsByTableGatewayAndPredicate($this, $deleteState['where']);
            if (!in_array($currentUserId, $predicateOwnerIds)) {
            //   $exceptionMessage = "Table harddelete access forbidden on $predicateResultQty `$deleteTable` table records owned by the authenticated CMS user (#$currentUserId).";
              $groupsTableGateway = self::makeTableGatewayFromTableName($this->acl, 'directus_groups', $this->adapter);
              $group = $groupsTableGateway->find($this->acl->getGroupId());
              $exceptionMessage = "[{$group['name']}] permissions only allow you to [delete] your own items.";
            //   $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
              throw new UnauthorizedTableDeleteException($exceptionMessage);
            }
          }
        }

        try {
            $this->emitter->run('table.delete:before', [$deleteTable]);
            $this->emitter->run('table.delete.' . $deleteTable . ':before');
            $result = parent::executeDelete($delete);
            $this->emitter->run('table.delete', [$deleteTable]);
            $this->emitter->run('table.delete:after', [$deleteTable]);
            $this->emitter->run('table.delete.' . $deleteTable);
            $this->emitter->run('table.delete.' . $deleteTable . ':after');
            return $result;
        } catch(\Zend\Db\Adapter\Exception\InvalidQueryException $e) {
            if('production' !== DIRECTUS_ENV) {
                throw new \RuntimeException("This query failed: " . $this->dumpSql($delete), 0, $e);
            }
            // @todo send developer warning
            throw $e;
        }
    }

    public function convertDates(array $records, array $schemaArray, $tableName = null)
    {
        $tableName = $tableName === null ? $this->table : $tableName;
        if (!SchemaManager::isDirectusTable($tableName)) {
            return $records;
        }

        // hotfix: records sometimes are no set as an array of rows.
        // NOTE: this code is duplicate @see: AbstractSchema::parseRecordValuesByType
        $singleRecord = false;
        if (!is_numeric_keys_array($records)) {
            $records = [$records];
            $singleRecord = true;
        }

        foreach($records as $index => $row) {
            foreach($schemaArray as $column) {
                if (in_array(strtolower($column['type']), ['timestamp', 'datetime'])) {
                    $columnName = $column['id'];
                    $records[$index][$columnName] = DateUtils::convertToISOFormat($row[$columnName], 'UTC', get_user_timezone());
                }
            }
        }

        return $singleRecord ? reset($records) : $records;
    }

    protected function parseRecordValuesByType($records, $tableName = null)
    {
        $tableName = $tableName === null ? $this->table : $tableName;
        $columns = TableSchema::getAllNonAliasTableColumns($tableName);

        return SchemaManager::parseRecordValuesByType($records, $columns);
    }

    protected function parseRecord($records, $tableName = null)
    {
        $tableName = $tableName === null ? $this->table : $tableName;
        $records = $this->parseRecordValuesByType($records, $tableName);
        $columns = TableSchema::getAllNonAliasTableColumns($tableName);
        $records = $this->convertDates($records, $columns, $tableName);

        return $records;
    }
}
