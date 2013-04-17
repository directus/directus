<?php

namespace Directus\Db\TableGateway;

use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\ResultSet\ResultSetInterface;
use Zend\Db\Sql\AbstractSql;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;
use Zend\Db\TableGateway\Feature\RowGatewayFeature;

use Directus\Application;
use Directus\Db\RowGateway\AclAwareRowGateway;

class AclAwareTableGateway extends \Zend\Db\TableGateway\TableGateway {

    protected $many_to_one_uis = array('many_to_one', 'single_media');

    /**
     * @param string $table
     * @param AdapterInterface $adapter
     * @throws Exception\InvalidArgumentException
     */
    public function __construct($table, AdapterInterface $adapter)
    {
        $rowGatewayPrototype = new AclAwareRowGateway('id', $table, $adapter);
        $features = new RowGatewayFeature($rowGatewayPrototype);
        parent::__construct($table, $adapter, $features);
    }

    protected function logger() {
        return Application::getApp()->getLog();
    }

    public function fetchAll() {
        return $this->select(function(Select $select) {

        });
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
        $row = $row->toArray();
        array_walk($row, array($this, 'castFloatIfNumeric'));
        return $row;
    }

    private function castFloatIfNumeric(&$value) {
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
