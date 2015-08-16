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
use Directus\Db\Hooks;
use Directus\Db\RowGateway\AclAwareRowGateway;
use Directus\Db\TableSchema;
use Directus\Util\Date;
use Directus\Util\Formatting;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\AbstractSql;
use Zend\Db\Sql\Delete;
use Zend\Db\Sql\Insert;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Update;
use Zend\Db\Sql\Where;
use Zend\Db\TableGateway\Feature;
use Zend\Db\TableGateway\Feature\RowGatewayFeature;
use Directus\MemcacheProvider;

class AclAwareTableGateway extends \Zend\Db\TableGateway\TableGateway {

    protected $acl;

    public $primaryKeyFieldName = "id";
    public $imagickExtensions = array('tiff', 'tif', 'psd', 'pdf');
    public $memcache;

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
        }

        $rowGatewayPrototype = new AclAwareRowGateway($acl, $this->primaryKeyFieldName, $table, $adapter);
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
            $datetime = Date::convertUtcDateTimeToTimeZone($col, $targetTimeZone);
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

    public function find($id, $pk_field_name = "id") {
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
        foreach($recordData as $columnName => $columnValue) {
            if(is_array($columnValue)) {
                $table = is_null($tableName) ? $this->table : $tableName;
                throw new SuppliedArrayAsColumnValue("Attempting to write an array as the value for column `$table`.`$columnName`.");
            }
        }

        $tableName = is_null($tableName) ? $this->table : $tableName;
        $rowExists = isset($recordData['id']);

        $TableGateway = new self($this->acl, $tableName, $this->adapter);
        if($rowExists) {
            $Update = new Update($tableName);
            $Update->set($recordData);
            $Update->where(array('id' => $recordData['id']));
            $TableGateway->updateWith($Update);

            Hooks::runHook('postUpdate', array($TableGateway, $recordData, $this->adapter, $this->acl));
        } else {
            //If we are adding a new directus_files Item, We need to do that logic
            // @todo: clean up/refactor saving file process
            if($tableName == "directus_files") {
              $Storage = new \Directus\Files\Storage\Storage();

              //If trying to save to temp, force to default
              if((!isset($recordData['storage_adapter']) || $recordData['storage_adapter'] == '') || $Storage->storageAdaptersByRole['TEMP']['id'] == $recordData['storage_adapter']) {
                $recordData['storage_adapter'] = $Storage->storageAdaptersByRole['DEFAULT']['id'];
              }

              $StorageAdapters = new DirectusStorageAdaptersTableGateway($this->acl, $this->adapter);
              //If desired Storage Adapter Exists...
              $filesAdapter = $StorageAdapters->fetchOneById($recordData['storage_adapter']);

              //Save Temp Thumbnail name for use after files record save
              // @todo: make file name format sanatize by default
              // same as uniqueName by the adapter
              // replacing space with underscore
              $originalFile = $recordData['name'];
              $recordData['name'] = str_replace(' ', '_', $recordData['name']);
              $info = pathinfo($recordData['name']);
              if( in_array($info['extension'], $this->imagickExtensions)) {
                $thumbnailName = "THUMB_".$info['filename'].'.jpg';
              } else {
                $thumbnailName = "THUMB_".$recordData['name'];
              }

              //If we are using files ID, Dont save until after insert
              if($Storage->getFilesSettings()['file_naming'] == "file_name") {
                //Save the file in TEMP Storage Adapter to Designated StorageAdapter
                $recordData['name'] = $Storage->saveFile($recordData['name'], $recordData['storage_adapter']);
                // $fileData = $Storage->saveData($recordData['data'], $recordData['name'], $filesAdapter['destination']);
                // $recordData['name'] = $fileData['name'];
              } else if($Storage->getFilesSettings()['file_naming'] == "file_hash") {
                //Save the file in TEMP Storage Adapter to Designated StorageAdapter
                $ext = pathinfo($recordData['name'], PATHINFO_EXTENSION);
                $fileHashName = md5(microtime() . $recordData['name']);
                $newName = $Storage->saveFile($recordData['name'], $recordData['storage_adapter'], $fileHashName.'.'.$ext);
                $updateArray['name'] = $fileHashName.'.'.$ext;
                $recordData['name'] = $updateArray['name'];
              }
            }

            $d = $recordData;
            unset($d['data']);
            $TableGateway->insert($d);
            $recordData['id'] = $TableGateway->getLastInsertValue();

            if($tableName == "directus_files") {
              $ext = pathinfo($recordData['name'], PATHINFO_EXTENSION);
              $updateArray = array();
              //If using file_id saving, then update record and set name to id
              if($Storage->getFilesSettings()['file_naming'] == "file_id") {
                $originalFile = $recordData['name'];
                $newName = $Storage->saveFile($recordData['name'], $recordData['storage_adapter'], str_pad($recordData['id'],11,"0", STR_PAD_LEFT).'.'.$ext);
                $updateArray['name'] = str_pad($recordData['id'],11,"0", STR_PAD_LEFT).'.'.$ext;
                $recordData['name'] = $updateArray['name'];
              }

              // @todo: do not make this file create twice.
              // file should be copied to temp and then work from there.
              // but is copied on "media" also on "temp" then copied back to "media"
              if(file_exists($filesAdapter['destination'].$originalFile)) {
                unlink($filesAdapter['destination'].$originalFile);
              }

              if(!empty($updateArray)) {
                $Update = new Update($tableName);
                $Update->set($updateArray);
                $Update->where(array('id' => $recordData['id']));
                $TableGateway->updateWith($Update);
              }

              //Save Temp Thumbnail to Thumbnail SA using file id: $params['id']
              $tempLocation = $Storage->storageAdaptersByRole['TEMP']['destination'];
              if(file_exists($tempLocation.$thumbnailName)) {
                $thumbnailDestination = $Storage->storageAdaptersByRole['THUMBNAIL']['destination'];
                if(in_array($ext, $this->imagickExtensions)) {
                  $ext = 'jpg';
                }
                $Storage->ThumbnailStorage->acceptFile($tempLocation.$thumbnailName, $recordData['id'].".".$ext, $thumbnailDestination);
                unlink($tempLocation.$thumbnailName);
              }
            }

            Hooks::runHook('postInsert', array($TableGateway, $recordData, $this->adapter, $this->acl));
        }

        $columns = TableSchema::getAllNonAliasTableColumnNames($tableName);
        $recordData = $TableGateway->fetchAll(function($select) use ($recordData, $columns) {
            $select
                ->columns($columns)
                ->limit(1);
            $select->where->equalTo('id', $recordData['id']);
        })->current();

        return $recordData;
    }

    /*
      Temporary solutions to fix add column error
        This add column is the same old-db add_column method
    */
    public function addColumn($tableName, $tableData) {
      $directus_types = array('MANYTOMANY', 'ONETOMANY', 'ALIAS');
      $data_type = $tableData['data_type'];
      // TODO: list all types which need manytoone ui
      // Hard-coded
      $manytoones = array('single_file', 'MANYTOONE');

      if (in_array($data_type, $directus_types)) {
          //This is a 'virtual column'. Write to directus schema instead of MYSQL
          $this->addVirtualColumn($tableName, $tableData);
      } else {
          $this->addTableColumn($tableName, $tableData);
          // Temporary solutions to #481, #645
          if(array_key_exists('ui', $tableData) && in_array($tableData['ui'], $manytoones)) {
            $tableData['relationship_type'] = 'MANYTOONE';
            $tableData['junction_key_right'] = $tableData['column_name'];
            $this->addVirtualColumn($tableName, $tableData);
          }
      }

      return $tableData['column_name'];
    }

    protected function addTableColumn($tableName, $columnData) {
      $column_name = $columnData['column_name'];
      $data_type = $columnData['data_type'];
      $comment = $columnData['comment'];

      if (array_key_exists('char_length', $columnData)) {
          $data_type = $data_type.'('.$columnData['char_length'].')';
      }
      $sql = "ALTER TABLE `$tableName` ADD COLUMN `$column_name` $data_type COMMENT '$comment'";

      $this->adapter->query( $sql )->execute();
    }

    protected function addVirtualColumn($tableName, $columnData) {
      $alias_columns = array('table_name', 'column_name', 'data_type', 'table_related', 'junction_table', 'junction_key_left','junction_key_right', 'sort', 'ui', 'comment', 'relationship_type');

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
        $this->acl->enforceBlacklist($table, $selectState['columns'], Acl::FIELD_READ_BLACKLIST);

        // Enforce field read blacklist on Select's join tables
        foreach($selectState['joins'] as $join) {
            $joinTable = $this->getRawTableNameFromQueryStateTable($join['name']);
            $this->acl->enforceBlacklist($joinTable, $join['columns'], Acl::FIELD_READ_BLACKLIST);
        }

        try {
            return parent::executeSelect($select);
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

        if(!$this->acl->hasTablePrivilege($insertTable, 'add')) {
            $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
            throw new UnauthorizedTableAddException($aclErrorPrefix . "Table add access forbidden on table $insertTable");
        }

        // Enforce write field blacklist (if user lacks bigedit privileges on this table)
        if(!$this->acl->hasTablePrivilege($insertTable, 'bigedit')) {
            $this->acl->enforceBlacklist($insertTable, $insertState['columns'], Acl::FIELD_WRITE_BLACKLIST);
        }

        try {
            return parent::executeInsert($insert);
        } catch(\Zend\Db\Adapter\Exception\InvalidQueryException $e) {
            if('production' !== DIRECTUS_ENV) {
                if (strpos(strtolower($e->getMessage()), 'duplicate entry')!==FALSE) {
                  throw new DuplicateEntryException($e->getMessage());
                }
                throw new \RuntimeException("This query failed: " . $this->dumpSql($insert), 0, $e);
            }
            // @todo send developer warning
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
        if(Auth::loggedIn()) {
            $currentUser = Auth::getUserInfo();
            $currentUserId = intval($currentUser['id']);
        }
        $updateState = $update->getRawState();
        $updateTable = $this->getRawTableNameFromQueryStateTable($updateState['table']);
        $cmsOwnerColumn = $this->acl->getCmsOwnerColumnByTable($updateTable);

        /**
         * ACL Enforcement
         */
        // check if it's NOT soft delete
        $updateFields = $updateState['set'];
        if(!(count($updateFields)==2 && array_key_exists(STATUS_COLUMN_NAME, $updateFields) && $updateFields[STATUS_COLUMN_NAME]==STATUS_DELETED_NUM)) {
          if(!$this->acl->hasTablePrivilege($updateTable, 'bigedit')) {
              // Parsing for the column name is unnecessary. Zend enforces raw column names.
              /**
               * Enforce Privilege: "Big" Edit
               */
              if(false === $cmsOwnerColumn) {
                  // All edits are "big" edits if there is no magic owner column.
                  $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
                  throw new UnauthorizedTableBigEditException($aclErrorPrefix . "The table `$updateTable` is missing the `user_create_column` within `directus_tables` (BigEdit Permission Forbidden)");
              } else {
                  // Who are the owners of these rows?
                  list($resultQty, $ownerIds) = $this->acl->getCmsOwnerIdsByTableGatewayAndPredicate($this, $updateState['where']);
                  // Enforce
                  if(is_null($currentUserId) || count(array_diff($ownerIds, array($currentUserId)))) {
                      $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
                      throw new UnauthorizedTableBigEditException($aclErrorPrefix . "Table bigedit access forbidden on $resultQty `$updateTable` table record(s) and " . count($ownerIds) . " CMS owner(s) (with ids " . implode(", ", $ownerIds) . ").");
                  }
              }

              /**
               * Enforce write field blacklist (if user lacks bigedit privileges on this table)
               */
              $attemptOffsets = array_keys($updateState['set']);
              $this->acl->enforceBlacklist($updateTable, $attemptOffsets, Acl::FIELD_WRITE_BLACKLIST);
          }

          if(!$this->acl->hasTablePrivilege($updateTable, 'edit')) {
              /**
               * Enforce Privilege: "Little" Edit (I am the record CMS owner)
               */
              if(false !== $cmsOwnerColumn) {
                  if(!isset($predicateResultQty)) {
                      // Who are the owners of these rows?
                      list($predicateResultQty, $predicateOwnerIds) = $this->acl->getCmsOwnerIdsByTableGatewayAndPredicate($this, $updateState['where']);
                  }
                  if(in_array($currentUserId, $predicateOwnerIds)) {
                      $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
                      throw new UnauthorizedTableEditException($aclErrorPrefix . "Table edit access forbidden on $predicateResultQty `$updateTable` table records owned by the authenticated CMS user (#$currentUserId).");
                  }
              }
          }
        }

        try {
            return parent::executeUpdate($update);
        } catch(\Zend\Db\Adapter\Exception\InvalidQueryException $e) {
            if('production' !== DIRECTUS_ENV) {
                // @TODO: these lines are the same as the executeInsert,
                // let's put it together
                if (strpos(strtolower($e->getMessage()), 'duplicate entry')!==FALSE) {
                  throw new DuplicateEntryException($e->getMessage());
                }
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
        // Is this table a junction table?
        $deleteTableSchema = TableSchema::getTable($deleteTable);
        $isDeleteTableAJunction = array_key_exists('is_junction_table', $deleteTableSchema) ? (bool)$deleteTableSchema['is_junction_table'] : false;

        if ($isDeleteTableAJunction || !TableSchema::hasTableColumn($deleteTable, STATUS_COLUMN_NAME)) {
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
              $exceptionMessage = "Table harddelete access forbidden on $predicateResultQty `$deleteTable` table records owned by the authenticated CMS user (#$currentUserId).";
              $aclErrorPrefix = $this->acl->getErrorMessagePrefix();
              throw new UnauthorizedTableDeleteException($aclErrorPrefix . $exceptionMessage);
            }
          }
        }

        try {
            return parent::executeDelete($delete);
        } catch(\Zend\Db\Adapter\Exception\InvalidQueryException $e) {
            if('production' !== DIRECTUS_ENV) {
                throw new \RuntimeException("This query failed: " . $this->dumpSql($delete), 0, $e);
            }
            // @todo send developer warning
            throw $e;
        }
    }
}
