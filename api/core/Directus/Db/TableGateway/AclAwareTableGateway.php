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

    public static function makeTableGatewayFromTableName($aclProvider, $table, $adapter) {
        /**
         * Underscore to camelcase table name to namespaced table gateway classname,
         * e.g. directus_users => \Directus\Db\TableGateway\DirectusUsersTableGateway
         */
        $tableGatewayClassName = underscoreToCamelCase($table) . "TableGateway";
        $tableGatewayClassName = __NAMESPACE__ . "\\$tableGatewayClassName";
        if(class_exists($tableGatewayClassName))
            return new $tableGatewayClassName($aclProvider, $adapter);
        return new self($aclProvider, $table, $adapter);
    }

    /**
     * OVERRIDES
     */

    /**
     * @todo add $columns support
     *
     * @param Insert $insert
     * @return mixed
     * @throws \Directus\Acl\Exception\UnauthorizedTableAddException
     */
    protected function executeInsert(Insert $insert)
    {
        if(!$this->aclProvider->hasTablePrivilege($this->table, 'add'))
            throw new UnauthorizedTableAddException("Table add access forbidden on table " . $this->table);
        return parent::executeInsert($insert);
    }


    public function fetchAllActiveSort($sort = null, $dir = "ASC") {
        return $this->select(function(Select $select) use ($sort, $dir) {
            $select->where->equalTo("active", 1);
            if(!is_null($sort)) {
                $select->order("$sort $dir");
            }
        });
    }

    public function find($id, $pk_field_name = "id") {
        $record = $this->findOneBy($pk_field_name, $id);
        return $record;
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
        $updateRaw = $update->getRawState();
        /**
         * Enforce Write Blacklist
         */
        // @todo will all fields lack table prefixes? what if they're prefixed arbitrarily?
        // or if they contain quotes? may need to normalize field names
        $attemptOffsets = array_keys($updateRaw['sets']);
        $this->aclProvider->enforceBlacklist($this->table, $attemptOffsets, Acl::FIELD_WRITE_BLACKLIST);
        parent::executeUpdate($update);
    }

    /**
     * HELPER FUNCTIONS
     */

    public function addOrUpdateRecordByArray(array $recordData, $tableName = null) {
        $log = $this->logger();
        $log->info(__CLASS__."#".__FUNCTION__);

        $tableName = is_null($tableName) ? $this->table : $tableName;

        $log->info("Making a new record for table $tableName with record data: " . print_r($recordData, true));

        $rowExists = isset($recordData['id']);
        $record = AclAwareRowGateway::makeRowGatewayFromTableName($this->aclProvider, $tableName, $this->adapter);
        $record->populateSkipAcl($recordData, $rowExists);
        // $record->populate($recordData, $rowExists);
        $record->save();
        return $record;
    }

    public function newRow($table = null, $pk_field_name = null)
    {
        $table = is_null($table) ? $this->table : $table;
        $pk_field_name = is_null($pk_field_name) ? $this->primaryKeyFieldName : $pk_field_name;
        $row = new AclAwareRowGateway($this->aclProvider, $pk_field_name, $table, $this->adapter);
        return $row;
    }

    protected function logger() {
        return Bootstrap::get('app')->getLog();
    }

    /**
     * Convenience method for dumping a ZendDb Sql query object as debug output.
     * @param  AbstractSql $query
     * @return null
     */
    protected function dumpSql(AbstractSql $query) {
        $sql = new Sql($this->adapter);
        $query = @$sql->getSqlStringForSqlObject($query);
        return $query;
    }

    public function fetchAll() {
        return $this->select(function(Select $select){});
    }

    public function newActivityLog($row, $tableName, $schema, $userId, $parentId = null, $type = DirectusActivityTableGateway::TYPE_ENTRY) {
        // Find record identifier
        $master_item = find($schema, 'master', true);

        $identifier = null;
        if($master_item && array_key_exists($master_item['column_name'], $row))
            $identifier = $row[$master_item['column_name']];

        // Make log entry
        $logEntry = array(
            'type' => $type,
            'action' => isset($row['id']) ? DirectusActivityTableGateway::ACTION_UPDATE : DirectusActivityTableGateway::ACTION_ADD,
            'identifier' => $identifier,
            'table_name' => $tableName,
            'row_id' => isset($row['id']) ? $row['id'] : null,
            'user' => $userId,
            'data' => json_encode($row),
            'parent_id' => $parentId
        );
        return $this->addOrUpdateRecordByArray($logEntry, 'directus_activity');
    }

    public function castFloatIfNumeric(&$value) {
        $value = is_numeric($value) ? (float) $value : $value;
    }

}
