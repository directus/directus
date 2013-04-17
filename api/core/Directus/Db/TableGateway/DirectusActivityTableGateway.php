<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;

class DirectusActivityTableGateway extends AclAwareTableGateway {

    // Populates directus_activity.type
    const TYPE_ENTRY    = "ENTRY";
    const TYPE_MEDIA    = "MEDIA";
    const TYPE_SETTINGS = "SETTINGS";
    const TYPE_UI       = "UI";

    // Populates directus_activity.action
    const ACTION_ADD    = "ADD";
    const ACTION_UPDATE = "UPDATE";

    public static $_tableName = "directus_activity";

    public function __construct(Acl $aclProvider, AdapterInterface $adapter) {
        parent::__construct($aclProvider, self::$_tableName, $adapter);
    }

    public function fetchFeed() {
        $columns = array('id','identifier','action','table_name','row_id','user','datetime','type');

        $sql = new Sql($this->adapter);
        $select = $sql->select()
            ->from($this->table)
            ->columns($columns)
            ->order('id DESC');
        $select
            ->where
                ->isNull('parent_id')
                ->OR
                ->equalTo('type', 'MEDIA');

        $rowset = $this->selectWith($select);
        $rowset = $rowset->toArray();
        return array('rows' => $rowset);
    }

    public function fetchRevisions($row_id, $table_name) {
        $columns = array('id','action','user','datetime');

        $sql = new Sql($this->adapter);
        $select = $sql->select()
            ->from($this->table)
            ->columns($columns)
            ->order('id DESC');
        $select
            ->where
                ->equalTo('row_id', $row_id)
                ->AND
                ->equalTo('table_name', $table_name);

        $result = $this->selectWith($select);
        $result = $result->toArray();
        return $result;
    }

}
