<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Acl\Exception\UnauthorizedTableAddException;
use Directus\Acl\Exception\UnauthorizedTableBigDeleteException;
use Directus\Acl\Exception\UnauthorizedTableBigEditException;
use Directus\Acl\Exception\UnauthorizedTableDeleteException;
use Directus\Acl\Exception\UnauthorizedTableEditException;
use Directus\Bootstrap;
use Directus\Db\Exception\SuppliedArrayAsColumnValue;
use Directus\Db\RowGateway\AclAwareRowGateway;
use Directus\Db\TableGateway\DirectusActivityTableGateway;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\AbstractSql;
use Zend\Db\Sql\Delete;
use Zend\Db\Sql\Insert;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Update;
use Zend\Db\Sql\Where;
use Zend\Db\TableGateway\Feature\RowGatewayFeature;

// FOR TRANSITIONAL TESTS BELOW
use Directus\Auth\Provider as Auth;
use Directus\Db\TableGateway\DirectusPrivilegesTableGateway;
use Zend\Db\Sql\Expression;

class AclAwareTableGateway extends \Zend\Db\TableGateway\TableGateway {

    protected $acl;

    public $primaryKeyFieldName = "id";

    /**
     * @param AclProvider $acl
     * @param string $table
     * @param AdapterInterface $adapter
     * @throws Exception\InvalidArgumentException
     */
    public function __construct(Acl $acl, $table, AdapterInterface $adapter)
    {
        $this->acl = $acl;
        $rowGatewayPrototype = new AclAwareRowGateway($acl, $this->primaryKeyFieldName, $table, $adapter);
        $features = new RowGatewayFeature($rowGatewayPrototype);
        parent::__construct($table, $adapter, $features);
    }

    /**
     * Static Factory Methods
     */

    /**
     * Underscore to camelcase table name to namespaced table gateway classname,
     * e.g. directus_users => \Directus\Db\TableGateway\DirectusUsersTableGateway
     */
    public static function makeTableGatewayFromTableName($acl, $table, $adapter) {
        $tableGatewayClassName = underscoreToCamelCase($table) . "TableGateway";
        $tableGatewayClassName = __NAMESPACE__ . "\\$tableGatewayClassName";
        if(class_exists($tableGatewayClassName))
            return new $tableGatewayClassName($acl, $adapter);
        return new self($acl, $table, $adapter);
    }

    /**
     * HELPER FUNCTIONS
     */

    public function find($id, $pk_field_name = "id") {
        $record = $this->findOneBy($pk_field_name, $id);
        return $record;
    }

    public function findActive($id, $pk_field_name = "id") {
        $rowset = $this->select(function(Select $select) use ($pk_field_name, $id) {
            $select->limit(1);
            $select
                ->where
                    ->equalTo($pk_field_name, $id)
                    ->AND
                    ->equalTo('active', AclAwareRowGateway::ACTIVE_STATE_ACTIVE);
        });
        $row = $rowset->current();
        // Supposing this "one" doesn't exist in the DB
        if(false === $row)
            return false;
        $row = $row->toArray();
        array_walk($row, array($this, 'castFloatIfNumeric'));
        return $row;
    }

    public function fetchAll() {
        return $this->select(function(Select $select){});
    }

    /**
     * @return array All rows in array form with record IDs for the array's keys.
     */
    public function fetchAllWithIdKeys() {
        $allWithIdKeys = array();
        $all = $this->fetchAll();
        foreach($all as $entry) {
            $allWithIdKeys[$entry[$this->primaryKeyFieldName]] = $entry;
        }
        return $allWithIdKeys;
    }

    public function fetchAllActiveSort($sort = null, $dir = "ASC") {
        return $this->select(function(Select $select) use ($sort, $dir) {
            $select->where->equalTo("active", 1);
            if(!is_null($sort)) {
                $select->order("$sort $dir");
            }
        });
    }

    public function findOneBy($field, $value) {
        $rowset = $this->select(function(Select $select) use ($field, $value) {
            $select->limit(1);
            $select->where->equalTo($field, $value);
        });
        $row = $rowset->current();
        // Supposing this "one" doesn't exist in the DB
        if(false === $row)
            return false;
        $row = $row->toArray();
        array_walk($row, array($this, 'castFloatIfNumeric'));
        return $row;
    }

    public function addOrUpdateRecordByArray(array $recordData, $tableName = null) {
        foreach($recordData as $columnName => $columnValue) {
            if(is_array($columnValue)) {
                $table = is_null($tableName) ? $this->table : $tableName;
                throw new SuppliedArrayAsColumnValue("Attempting to write an array as the value for column `$table`.`$columnName`.");
            }
        }
        // $log = $this->logger();
        // $log->info(__CLASS__."#".__FUNCTION__);

        $tableName = is_null($tableName) ? $this->table : $tableName;
        $rowExists = isset($recordData['id']);

        // $recordAction = $rowExists ? "Populating an existing" : "Making a new";
        // $log->info("$recordAction record for table $tableName with record data: " . print_r($recordData, true));

        $record = AclAwareRowGateway::makeRowGatewayFromTableName($this->acl, $tableName, $this->adapter);
        $record->populateSkipAcl($recordData, $rowExists);
        // $record->populate($recordData, $rowExists);
        $record->save();
        return $record;
    }

    protected function logger() {
        return Bootstrap::get('app')->getLog();
    }

    public function castFloatIfNumeric(&$value) {
        $value = is_numeric($value) ? (float) $value : $value;
    }

    /**
     * Convenience method for dumping a ZendDb Sql query object as debug output.
     * @param  AbstractSql $query
     * @return null
     */
    public function dumpSql(AbstractSql $query) {
        $sql = new Sql($this->adapter);
        $query = @$sql->getSqlStringForSqlObject($query);
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
        if(is_string($table))
            return $table;
        if(is_array($table))
            // The only value is the real table name (key is alias).
            return array_pop($table);
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

        return parent::executeSelect($select);
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

        if(!$this->acl->hasTablePrivilege($insertTable, 'add'))
            throw new UnauthorizedTableAddException("Table add access forbidden on table $insertTable");

        // Enforce write field blacklist (if user lacks bigedit privileges on this table)
        if(!$this->acl->hasTablePrivilege($insertTable, 'bigedit')) {
            // Parsing for the column name is unnecessary. Zend enforces raw column names.
            // $rawColumns = $this->extractRawColumnNames($insertState['columns']);
            $this->acl->enforceBlacklist($insertTable, $insertState['columns'], Acl::FIELD_WRITE_BLACKLIST);
        }

        return parent::executeInsert($insert);
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
        $cuurrentUserId = null;
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

        if(!$this->acl->hasTablePrivilege($updateTable, 'bigedit')) {
            // Parsing for the column name is unnecessary. Zend enforces raw column names.
            // $rawColumns = $this->extractRawColumnNames($updateState['columns']);
            /**
             * Enforce Privilege: "Big" Edit
             */
            if(false === $cmsOwnerColumn) {
                // All edits are "big" edits if there is no magic owner column.
                throw new UnauthorizedTableBigEditException("Table bigedit access forbidden on table `$updateTable` (no magic owner column).");
            } else {
                // Who are the owners of these rows?
                list($resultQty, $ownerIds) = $this->acl->getCmsOwnerIdsByTableGatewayAndPredicate($this, $updateState['where']);
                // Enforce
                if(is_null($currentUserId) || count(array_diff($ownerIds, array($currentUserId)))) {
                    throw new UnauthorizedTableBigEditException("Table bigedit access forbidden on $resultQty `$updateTable` table record(s) and " . count($ownerIds) . " CMS owner(s) (with ids " . implode(", ", $ownerIds) . ").");
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
                    throw new UnauthorizedTableEditException("Table edit access forbidden on $predicateResultQty `$updateTable` table records owned by the authenticated CMS user (#$currentUserId).");
                }
            }
        }

        parent::executeUpdate($update);
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

        /**
         * ACL Enforcement
         */

        if(!$this->acl->hasTablePrivilege($deleteTable, 'bigdelete')) {
            /**
             * Enforce Privilege: "Big" Delete
             */
            if(false === $cmsOwnerColumn) {
                // All deletes are "big" deletes if there is no magic owner column.
                throw new UnauthorizedTableBigDeleteException("Table bigdelete access forbidden on table `$deleteTable` (no magic owner column).");
            } else {
                // Who are the owners of these rows?
                list($predicateResultQty, $predicateOwnerIds) = $this->acl->getCmsOwnerIdsByTableGatewayAndPredicate($this, $deleteState['where']);
                // Enforce
                if(is_null($currentUserId) || count(array_diff($predicateOwnerIds, array($currentUserId)))) {
                    throw new UnauthorizedTableBigDeleteException("Table bigdelete access forbidden on $predicateResultQty `$deleteTable` table record(s) and " . count($predicateOwnerIds) . " CMS owner(s) (with ids " . implode(", ", $predicateOwnerIds) . ").");
                }
            }
        }

        if(!$this->acl->hasTablePrivilege($deleteTable, 'delete')) {
            /**
             * Enforce Privilege: "Little" Delete (I am the record CMS owner)
             */
            if(false !== $cmsOwnerColumn) {
                if(!isset($predicateResultQty)) {
                    // Who are the owners of these rows?
                    list($predicateResultQty, $predicateOwnerIds) = $this->acl->getCmsOwnerIdsByTableGatewayAndPredicate($this, $deleteState['where']);
                }
                if(in_array($currentUserId, $predicateOwnerIds)) {
                    $exceptionMessage = "Table delete access forbidden on $predicateResultQty `$deleteTable` table records owned by the authenticated CMS user (#$currentUserId).";
                    throw new UnauthorizedTableDeleteException($exceptionMessage);
                }
            }
        }

        return parent::executeDelete($delete);
    }

}
