<?php

namespace Directus\Database\TableGateway;

use Directus\Permissions\Acl;
use Zend\Db\Adapter\Adapter;
use Zend\Db\Adapter\AdapterInterface;

class DirectusGroupsTableGateway extends RelationalTableGateway
{
    public static $_tableName = 'directus_groups';

    public $primaryKeyFieldName = 'id';

    public function __construct(AdapterInterface $adapter, Acl $acl = null)
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
        if (!$groupID) {
            return false;
        }

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
