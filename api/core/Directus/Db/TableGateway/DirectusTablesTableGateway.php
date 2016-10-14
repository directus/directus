<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Zend\Db\Adapter\AdapterInterface;

class DirectusTablesTableGateway extends BaseTableGateway
{
    public static $_tableName = 'directus_tables';

    public $primaryKeyFieldName = 'table_name';

    public function __construct(AdapterInterface $adapter, Acl $acl)
    {
        parent::__construct(self::$_tableName, $adapter, $acl);
    }
}
