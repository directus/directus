<?php

namespace Directus\Database\TableGateway;

use Directus\Permissions\Acl;
use Zend\Db\Adapter\AdapterInterface;

class DirectusCollectionsTableGateway extends RelationalTableGateway
{
    public static $_tableName = 'directus_collections';

    public $primaryKeyFieldName = 'collection';

    public function __construct(AdapterInterface $adapter, Acl $acl)
    {
        parent::__construct(self::$_tableName, $adapter, $acl);
    }
}
