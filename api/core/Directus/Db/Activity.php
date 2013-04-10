<?php

namespace Directus\Db;

use Directus\Acl\Acl;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;

class Activity extends AclAwareTableGateway {

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

        // $action = isset($data['id']) ? 'UPDATE' : 'ADD';
        // $master_item = find($schema,'master',true);
        // $identifier = isset($master_item) ? $data[$master_item['column_name']] : null;
        // $activity_id = $this->log_activity('ENTRY',$tbl_name, $action, $id, $identifier, $data, $parent_activity_id);

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
