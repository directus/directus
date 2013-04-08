<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Acl\Exception\UnauthorizedAddException;
use Directus\Bootstrap;
use Directus\Db\RowGateway\AclAwareRowGateway;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\AbstractSql;
use Zend\Db\Sql\Insert;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;
use Zend\Db\TableGateway\Feature\RowGatewayFeature;

class AclAwareTableGateway extends \Zend\Db\TableGateway\TableGateway {

    protected $many_to_one_uis = array('many_to_one', 'single_media');

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
     * OVERRIDES
     */

    /**
     * Insert
     *
     * @param  array $set
     * @return int
     * @throws \Directus\Acl\Exception\UnauthorizedAddException
     */
    public function insert($set)
    {
        $this->checkAddRights();
        return parent::insert($set);
    }

    /**
     * @param Insert $insert
     * @return mixed
     * @throws \Directus\Acl\Exception\UnauthorizedAddException
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
     * @throws \Directus\Acl\Exception\UnauthorizedAddException
     */
    public function checkAddRights() {
        if(!$this->aclProvider->hasTablePrivilege($this->table, 'add')) {
            throw new UnauthorizedAddException("Group lacks permission to add records to table: " . $this->table);
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

    public function fetchAll() {
        return $this->select(function(Select $select) {

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
        array_walk($row, array($this, 'castFloatIfNumeric'));
        return $row;
    }

    public function castFloatIfNumeric(&$value) {
        $value = is_numeric($value) ? (float) $value : $value;
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

}
