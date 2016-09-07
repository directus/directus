<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Zend\Db\Adapter\AdapterInterface;

class DirectusTablesTableGateway extends AclAwareTableGateway
{

    public static $_tableName = 'directus_tables';

    public $primaryKeyFieldName = 'table_name';

    public function __construct(Acl $acl, AdapterInterface $adapter)
    {
        parent::__construct($acl, self::$_tableName, $adapter);
    }

}
