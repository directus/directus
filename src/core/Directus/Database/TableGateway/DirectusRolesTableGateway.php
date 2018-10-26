<?php

namespace Directus\Database\TableGateway;

use Directus\Permissions\Acl;
use Zend\Db\Adapter\AdapterInterface;

class DirectusRolesTableGateway extends RelationalTableGateway
{
    public static $_tableName = 'directus_roles';

    public $primaryKeyFieldName = 'id';

    public function __construct(AdapterInterface $adapter, Acl $acl = null)
    {
        parent::__construct(self::$_tableName, $adapter, $acl);
    }
}
