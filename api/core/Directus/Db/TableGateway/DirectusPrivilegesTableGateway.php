<?php

namespace Directus\Db\TableGateway;

use Directus\Acl\Acl;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Directus\Db\TableSchema;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Update;
use Zend\Db\Sql\Insert;

class DirectusPrivilegesTableGateway extends AclAwareTableGateway {

    public static $_tableName = "directus_privileges";

    public function __construct(Acl $acl, AdapterInterface $adapter) {
        parent::__construct($acl, self::$_tableName, $adapter);
    }

    public function fetchGroupPrivileges($group_id) {
        $select = new Select($this->table);
        $select->where->equalTo('group_id', $group_id);
        $rowset = $this->selectWith($select);
        $rowset = $rowset->toArray();
        $privilegesByTable = array();
        foreach($rowset as $row) {
            foreach($row as $field => &$value) {
                if($this->acl->isTableListValue($field))
                    $value = explode(",", $value);
                $privilegesByTable[$row['table_name']] = $row;
            }
        }
        return $privilegesByTable;
    }

    public function fetchById($privilegeId) {
        $select = new Select($this->table);
        $select->where->equalTo('id', $privilegeId);
        $rowset = $this->selectWith($select);
        $rowset = $rowset->toArray();
        return current($rowset);
    }

    // @todo This currently only supports permissions,
    // include blacklists when there is a UI for it
    public function insertPrivilege($attributes) {
        $insert = new Insert($this->getTable());
        $insert
            ->columns(array('table_name','permissions','group_id'))
            ->values(array(
                'table_name' => $attributes['table_name'],
                'permissions' => $attributes['permissions'],
                'group_id' => $attributes['group_id']
                ));
        $this->insertWith($insert);

        $privilegeId = $this->lastInsertValue;

        return $this->fetchById($privilegeId);
    }

    // @todo This currently only supports permissions,
    // include blacklists when there is a UI for it
    public function updatePrivilege($attributes) {
        $update = new Update($this->getTable());
        $update->where->equalTo('id', $attributes['id']);
        $update->set(array('permissions' => $attributes['permissions']));
        $this->updateWith($update);

        return $this->fetchById($attributes['id']);
    }

    public function fetchPerTable($groupId) {
        // Don't include tables that can't have privileges changed
        $blacklist = array(
            'directus_columns',
            'directus_ip_whitelist',
            'directus_messages_recepients',
            'directus_preferences',
            'directus_privileges',
            'directus_settings',
            'directus_social_feeds',
            'directus_social_posts',
            'directus_storage_adapters',
            'directus_tab_privileges',
            'directus_tables',
            'directus_ui',
            'directus_users_copy'
        );


        $select = new Select($this->table);
        $select->where->equalTo('group_id', $groupId);
        $select->group(array('group_id', 'table_name'));
        $rowset = $this->selectWith($select);
        $rowset = $rowset->toArray();

        $tableSchema = new TableSchema();
        $tables = $tableSchema->getTablenames();
        $privileges = array();
        $privilegesHash = array();

        foreach ($rowset as $item) {
            $privilegesHash[$item['table_name']] = $item;
        }

        foreach ($tables as $table) {
            if (in_array($table, $blacklist)) {
                continue;
            }
            if (array_key_exists($table, $privilegesHash)) {
                $item = $privilegesHash[$table];
            } else {
                $item = array('table_name' => $table, 'group_id'=> $groupId);
            }

            $privileges[] = $item;
        }

        return $privileges;
    }

    public function fetchGroupPrivilegesRaw($group_id) {
        $select = new Select($this->table);
        $select->where->equalTo('group_id', $group_id);
        $rowset = $this->selectWith($select);
        $rowset = $rowset->toArray();
        return $rowset;
    }
}
