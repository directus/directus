<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;

class DirectusStorageAdaptersTableGateway extends AclAwareTableGateway {

    public static $_tableName = "directus_storage_adapters";

    public function __construct(Acl $acl, AdapterInterface $adapter) {
        parent::__construct($acl, self::$_tableName, $adapter);
    }

    public function fetchByUniqueRoles(array $roleNames) {
        $select = new Select(self::$_tableName);
        $select->group('role');
        $select->where->in('role', $roleNames);
        $rows = $this->selectWith($select);
        $roles = array();
        foreach($rows as $row) {
            $adapter = $row->toArray();
            // The adapter's `params` column is JSON serialized.
            if(!empty($adapter['params']) && $decoded = json_decode($adapter['params'], true)) {
                $adapter['params'] = $decoded;
            }
            $roles[$adapter['role']] = $adapter;
        }
        return $roles;
    }

    public function fetchOneByKey($key) {
        $select = new Select(self::$_tableName);
        $select->limit(1);
        $select->where->equalTo('key', $key);
        $adapter = $this->selectWith($select)->current();
        if(!$adapter) {
            return false;
        }
        if(!empty($adapter['params']) && $decoded = json_decode($adapter['params'], true)) {
            $adapter['params'] = $decoded;
        } else {
            $adapter['params'] = array();
        }
        return $adapter;
    }

}
