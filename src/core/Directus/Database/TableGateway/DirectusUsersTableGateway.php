<?php

namespace Directus\Database\TableGateway;

use Directus\Permissions\Acl;
use Zend\Db\Adapter\AdapterInterface;

class DirectusUsersTableGateway extends RelationalTableGateway
{
    const STATUS_DELETED = 'deleted';
    const STATUS_ACTIVE = 'active';
    const STATUS_DRAFT = 'draft';
    const STATUS_SUSPENDED = 'suspended';
    const STATUS_INVITED = 'invited';

    const GRAVATAR_SIZE = 100;

    public static $_tableName = 'directus_users';

    public $primaryKeyFieldName = 'id';

    public function __construct(AdapterInterface $adapter, Acl $acl = null)
    {
        parent::__construct(self::$_tableName, $adapter, $acl);
    }
}
