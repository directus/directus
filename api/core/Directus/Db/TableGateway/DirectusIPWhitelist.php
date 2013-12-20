<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Sql;
use Zend\Db\Adapter\Adapter;

class DirectusIPWhitelist extends AclAwareTableGateway {

    public static $_tableName = "directus_ip_whitelist";

    public function __construct(Acl $acl, AdapterInterface $adapter) {
        parent::__construct($acl, self::$_tableName, $adapter);
    }

    public function hasIP($ip) {
        $select = new Select($this->table);
        $select->where->equalTo('ip_address', $ip);
		$whitelist = $this->selectWith($select);
        $whitelist = $whitelist->toArray();
        return (count($whitelist) > 0);
        print_r($whitelist);
    }
}
