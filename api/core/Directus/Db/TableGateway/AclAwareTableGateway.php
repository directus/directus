<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Acl\Exception\UnauthorizedTableAddException;
use Directus\Bootstrap;
use Directus\Db\RowGateway\AclAwareRowGateway;
use Directus\Db\TableGateway\DirectusActivityTableGateway;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\AbstractSql;
use Zend\Db\Sql\Insert;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Update;
use Zend\Db\TableGateway\Feature\RowGatewayFeature;

// FOR TRANSITIONAL TESTS BELOW
use Directus\Auth\Provider as AuthProvider;
use Directus\Db\TableGateway\DirectusPrivilegesTableGateway;
use Zend\Db\Sql\Expression;

class AclAwareTableGateway extends \Zend\Db\TableGateway\TableGateway {

    protected $aclProvider;

    protected $primaryKeyFieldName = "id";

    /**
     * @param AclProvider $aclProvider
     * @param string $table
     * @param AdapterInterface $adapter
     * @throws Exception\InvalidArgumentException
     */
    public function __construct(Acl $aclProvider, $table, AdapterInterface $adapter)
    {
        $this->aclProvider = $aclProvider;
        $rowGatewayPrototype = new AclAwareRowGateway($aclProvider, $this->primaryKeyFieldName, $table, $adapter);
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
    public static function makeTableGatewayFromTableName($aclProvider, $table, $adapter) {
        $tableGatewayClassName = underscoreToCamelCase($table) . "TableGateway";
        $tableGatewayClassName = __NAMESPACE__ . "\\$tableGatewayClassName";
        if(class_exists($tableGatewayClassName))
            return new $tableGatewayClassName($aclProvider, $adapter);
        return new self($aclProvider, $table, $adapter);
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
        // $log = $this->logger();
        // $log->info(__CLASS__."#".__FUNCTION__);

        $tableName = is_null($tableName) ? $this->table : $tableName;
        $rowExists = isset($recordData['id']);

        // $recordAction = $rowExists ? "Populating an existing" : "Making a new";
        // $log->info("$recordAction record for table $tableName with record data: " . print_r($recordData, true));

        $record = AclAwareRowGateway::makeRowGatewayFromTableName($this->aclProvider, $tableName, $this->adapter);
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

    /**
     * OVERRIDES
     */

    /**
     * @param Insert $insert
     * @return mixed
     * @throws \Directus\Acl\Exception\UnauthorizedTableAddException
     */
    protected function executeInsert(Insert $insert)
    {
        /**
         * ACL Enforcement
         */

        if(!$this->aclProvider->hasTablePrivilege($this->table, 'add'))
            throw new UnauthorizedTableAddException("Table add access forbidden on table " . $this->table);

        // Enforce write field blacklist (if user lacks bigedit privileges on this table)
        if(!$this->aclProvider->hasTablePrivilege($this->table, 'bigedit')) {
            $insertState = $insert->getRawState();
            // Parsing for the column name is unnecessary. Zend enforces raw column names.
            // $rawColumns = $this->extractRawColumnNames($insertState['columns']);
            $this->aclProvider->enforceBlacklist($this->table, $insertState['columns'], Acl::FIELD_WRITE_BLACKLIST);
        }

        return parent::executeInsert($insert);
    }

    /**
     * @param Update $update
     * @return mixed
     * @throws Exception\RuntimeException
     * @throws \Directus\Acl\Exception\UnauthorizedFieldWriteException
     *
     * @todo  needs testing
     */
    protected function executeUpdate(Update $update)
    {
        /**
         * ACL Enforcement
         */

        // Enforce write field blacklist (if user lacks bigedit privileges on this table)
        if(!$this->aclProvider->hasTablePrivilege($this->table, 'bigedit')) {
            $updateState = $update->getRawState();
            // Parsing for the column name is unnecessary. Zend enforces raw column names.
            // $rawColumns = $this->extractRawColumnNames($updateState['columns']);
            $attemptOffsets = array_keys($updateState['set']);
            $this->aclProvider->enforceBlacklist($this->table, $attemptOffsets, Acl::FIELD_WRITE_BLACKLIST);
        }

        parent::executeUpdate($update);
    }

    /**
     * PENDING UNIT TESTS
     * Proofs of concept for development & debugging
     */

    /** Test for executeUpdate ACL protection */
    public function testUpdateWriteBlacklistEnforcement() {
        $Privileges = new DirectusPrivilegesTableGateway($this->aclProvider, $this->adapter);
        $Users = new DirectusUsersTableGateway($this->aclProvider, $this->adapter);

        $currentUser = AuthProvider::getUserInfo();
        $currentUser = $Users->find($currentUser['id']);

        $groupPrivileges = $Privileges->fetchGroupPrivileges($currentUser['group']);
        $groupPrivileges['directus_activity']['write_field_blacklist'] = array('data');
        // Omit "big" privileges
        $groupPrivileges['directus_activity']['permissions'] = array('add','edit','delete');

        $this->aclProvider->setGroupPrivileges($groupPrivileges);

        // This should throw an AclException
        $this->update(array(
            'type'          => 'ENTRY',
            'action'        => 'UPDATE',
            'identifier'    => 'Gerry',
            'table_name'    => 'directus_users',
            'row_id'        => 4,
            'user'          => 3,
            'data'          => '{1:3,2:4}',
            'parent_id'     => 'null',
            'datetime'      => new Expression('NOW()')
        ), array('1' => '1'));
    }

    /** Test for executeInsert ACL protection */
    public function testInsertWriteBlacklistEnforcement() {
        $Privileges = new DirectusPrivilegesTableGateway($this->aclProvider, $this->adapter);
        $Users = new DirectusUsersTableGateway($this->aclProvider, $this->adapter);

        $currentUser = AuthProvider::getUserInfo();
        $currentUser = $Users->find($currentUser['id']);

        $groupPrivileges = $Privileges->fetchGroupPrivileges($currentUser['group']);
        $groupPrivileges['directus_activity']['write_field_blacklist'] = array('data');
        // Omit "big" privileges
        $groupPrivileges['directus_activity']['permissions'] = array('add','edit','delete');

        $this->aclProvider->setGroupPrivileges($groupPrivileges);

        // This should throw an AclException
        $this->insert(array(
            'add'           => null,
            'type'          => 'ENTRY',
            'action'        => 'UPDATE',
            'identifier'    => 'Gerry',
            'table_name'    => 'directus_users',
            'row_id'        => 4,
            'user'          => 3,
            'data'          => '{1:3,2:4}',
            'parent_id'     => null,
            'datetime'      => new Expression('NOW()')
        ), array('1' => '1'));
    }

    /** Test for executeInsert ACL protection */
    public function testInsertAddEnforcement() {
        $Privileges = new DirectusPrivilegesTableGateway($this->aclProvider, $this->adapter);
        $Users = new DirectusUsersTableGateway($this->aclProvider, $this->adapter);

        $currentUser = AuthProvider::getUserInfo();
        $currentUser = $Users->find($currentUser['id']);

        $groupPrivileges = $Privileges->fetchGroupPrivileges($currentUser['group']);
        $groupPrivileges['directus_activity']['write_field_blacklist'] = array('data');
        // Omit "add" privileges
        $groupPrivileges['directus_activity']['permissions'] = array('edit','delete');

        $this->aclProvider->setGroupPrivileges($groupPrivileges);

        // This should throw an AclException
        $this->insert(array(
            'add'           => null,
            'type'          => 'ENTRY',
            'action'        => 'UPDATE',
            'identifier'    => 'Gerry',
            'table_name'    => 'directus_users',
            'row_id'        => 4,
            'user'          => 3,
            'data'          => '{1:3,2:4}',
            'parent_id'     => null,
            'datetime'      => new Expression('NOW()')
        ), array('1' => '1'));
    }

}
