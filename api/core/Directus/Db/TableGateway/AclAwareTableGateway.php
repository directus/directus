<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Acl\Exception\UnauthorizedTableAddException;
use Directus\Bootstrap;
use Directus\Db\TableGateway\DirectusActivityTableGateway;
use Directus\Db\RowGateway\AclAwareRowGateway;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\AbstractSql;
use Zend\Db\Sql\Insert;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;
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
     * Insert
     *
     * @param  array $set
     * @return int
     * @throws \Directus\Acl\Exception\UnauthorizedTableAddException
     */
    public function insert($set)
    {
        $this->checkAddRights();
        return parent::insert($set);
    }

    /**
     * @param Insert $insert
     * @return mixed
     * @throws \Directus\Acl\Exception\UnauthorizedTableAddException
     */
    public function insertWith(Insert $insert)
    {
        $this->checkAddRights();
        return parent::insertWith($insert);
    }

    /**
     * HELPER FUNCTIONS
     */

    /**
     * Is the user group allowed to create new records?
     * @return  null
     * @throws \Directus\Acl\Exception\UnauthorizedTableAddException
     */
    public function checkAddRights() {
        if(!$this->aclProvider->hasTablePrivilege($this->table, 'add')) {
            throw new UnauthorizedTableAddException("Group lacks permission to add records to table: " . $this->table);
        }
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

    public function findOneBy($field, $value) {
        $rowset = $this->select(function(Select $select) use ($field, $value) {
            $select->limit(1);
            $select->where->equalTo($field, $value);
        });
        $row = $rowset->current();
        array_walk($row, array($this, 'castFloatIfNumeric'));
        return $row;
    }

    public function find($id, $pk_field_name = "id") {
        $record = $this->findOneBy($pk_field_name, $id);
        return $record;
    }

    public function addOrUpdateRecordByArray(array $recordData , $tableName = null) {
        $tableName = is_null($tableName) ? $this->table : $tableName;
        $rowExists = isset($recordData['id']);
        $record = AclAwareRowGateway::makeRowGatewayFromTableName($this->aclProvider, $tableName, $this->adapter);
        $record->populateSkipAcl($recordData, $rowExists);
        $record->save();
        return $record;
    }

    public function newActivityLog($row, $tableName, $schema, $userId, $parentId = null, $type = DirectusActivityTableGateway::TYPE_ENTRY) {
        // Find record identifier
        $master_item = find($schema, 'master', true);
        $identifier = $master_item ? $row[$master_item['column_name']] : null;
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
