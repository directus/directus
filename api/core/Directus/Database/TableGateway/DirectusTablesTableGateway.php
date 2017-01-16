<?php

namespace Directus\Database\TableGateway;

use Directus\Permissions\Acl;
use Zend\Db\Adapter\AdapterInterface;

class DirectusTablesTableGateway extends RelationalTableGateway
{
    public static $_tableName = 'directus_tables';

    public $primaryKeyFieldName = 'table_name';

    public function __construct(AdapterInterface $adapter, Acl $acl)
    {
        parent::__construct(self::$_tableName, $adapter, $acl);
    }
}
