<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;

class DirectusSocialFeedsTableGateway extends AclAwareTableGateway {

    public static $_tableName = "directus_social_feeds";

    const TYPE_TWITTER = 1;
    const TYPE_INSTAGRAM = 2;

    public function __construct(Acl $acl, AdapterInterface $adapter) {
        parent::__construct($acl, self::$_tableName, $adapter);
    }

    public function getFeedByHandleAndType($handle, $type) {
        $select = new Select($this->getTable());
        $select->limit(1);
        $select
            ->where
                ->equalTo('name', $handle)
                ->equalTo('type', $type);
        $rowset = $this->selectWith($select);
        return $rowset->current();
    }

}
