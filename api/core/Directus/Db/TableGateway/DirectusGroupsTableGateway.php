<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Zend\Db\Adapter\Adapter;
use Zend\Db\Adapter\AdapterInterface;

class DirectusGroupsTableGateway extends BaseTableGateway
{
    public static $_tableName = 'directus_groups';

    public function __construct(AdapterInterface $adapter, Acl $acl)
    {
        parent::__construct(self::$_tableName, $adapter, $acl);
    }

    // @todo sanitize parameters and implement ACL
    public function findUserByFirstOrLastName($tokens)
    {
        $tokenString = implode('|', $tokens);
        $sql = 'SELECT id, "directus_groups" as type, name from `directus_groups` WHERE `name` REGEXP "^(' . $tokenString . ')"';
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
