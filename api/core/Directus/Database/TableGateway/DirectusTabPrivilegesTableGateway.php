<?php

namespace Directus\Database\TableGateway;

use Directus\Permissions\Acl;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Select;

class DirectusTabPrivilegesTableGateway extends BaseTableGateway
{
    public static $tableName = 'directus_tab_privileges';

    public function __construct(AdapterInterface $adapter, Acl $acl)
    {
        parent::__construct(self::$tableName, $adapter, $acl);
    }

    public function fetchAllByGroup($groupId)
    {
        $select = new Select($this->getTable());
        $select->limit(1);
        $select->where->equalTo('group_id', $groupId);
        $row = $this->selectWith($select)->toArray();
        if (!$row) {
            return [];
        }

        $row = $row[0];
        if (array_key_exists('nav_override', $row)) {
            if (!empty($row['nav_override'])) {
                $row['nav_override'] = @json_decode($row['nav_override']);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    $row['nav_override'] = false;
                }
            } else {
                $row['nav_override'] = NULL;
            }
        }
        return $row;
    }
}
