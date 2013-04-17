<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;

class DirectusSettingsTableGateway extends AclAwareTableGateway {

    public static $_tableName = "directus_settings";

    public function __construct(Acl $aclProvider, AdapterInterface $adapter) {
        parent::__construct($aclProvider, self::$_tableName, $adapter);
    }

    public function fetchAll() {
        $sql = new Sql($this->adapter);
        $select = $sql->select()->from($this->table);
        $select->columns(array('collection','name','value'))
            ->order('collection');
        // Fetch row
        $rowset = $this->selectWith($select);
        $rowset = $rowset->toArray();

        $result = array();
        foreach($rowset as $row) {
            $collection = $row['collection'];
            if(!array_key_exists($collection, $result))
                $result[$collection] = array();
            $result[$collection][$row['name']] = $row['value'];
        }
        return $result;
    }

}
