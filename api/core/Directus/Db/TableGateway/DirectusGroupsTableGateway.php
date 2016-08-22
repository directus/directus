<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Sql;
use Zend\Db\Adapter\Adapter;

class DirectusGroupsTableGateway extends AclAwareTableGateway
{
    public static $_tableName = "directus_groups";

    public function __construct(Acl $acl, AdapterInterface $adapter)
    {
        parent::__construct($acl, self::$_tableName, $adapter);
    }

    // @todo sanitize parameters and implement ACL
    public function findUserByFirstOrLastName($tokens)
    {
        $tokenString = implode("|", $tokens);
        $sql = "SELECT id, 'directus_groups' as type, name from `directus_groups` WHERE `name` REGEXP '^($tokenString)'";
        $result = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);
        return $result->toArray();
    }

    public function acceptIP($groupID, $ipAddress)
    {
        $group = $this->find($groupID);
        if (!$group) {
            return false;
        }

        if (!$group['restrict_to_ip_whitelist']) {
            return true;
        }

        $groupIPAddresses = explode(',', $group['restrict_to_ip_whitelist']);
        if (in_array($ipAddress, $groupIPAddresses)) {
            return true;
        }

        return false;
    }
}
