<?php

namespace Directus\Db;

use Directus\Acl;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;

class Privileges extends AclAwareTableGateway {

    public static $_tableName = "directus_privileges";

    public function __construct(Acl $aclProvider, AdapterInterface $adapter) {
        parent::__construct($aclProvider, self::$_tableName, $adapter);
    }

    public function fetchGroupPrivileges($group_id) {
        $select = new Select($this->table);
        $select->where->equalTo('group_id', $group_id);
        $rowset = $this->selectWith($select);
        $rowset = $rowset->toArray();
        $privilegesByTable = array();
        foreach($rowset as $row) {
            foreach($row as $field => &$value) {
                if($this->aclProvider->isTableListValue($field))
                    $value = explode(",", $value);
                $privilegesByTable[$row['table_name']] = $row;
            }
        }
        return $privilegesByTable;
    }

}
