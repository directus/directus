<?php

namespace Directus\Db\TableGateway;

use Directus\Auth\Provider as Auth;
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

    // @todo: make this part of every table gateway
    private $fillable = array(
        'allow_view',
        'allow_add',
        'allow_delete',
        'allow_edit',
        'allow_alter',
        'nav_listed',
        'read_field_blacklist',
        'write_field_blacklist',
        'group_id',
        'table_name',
        'status_id',
    );

    public function __construct(Acl $acl, AdapterInterface $adapter) {
        parent::__construct($acl, self::$_tableName, $adapter);
    }

    // @TODO: move it to another object.
    private function isCurrentUserAdmin() {
        $currentUser = Auth::getUserRecord();

        //Dont let non-admins have alter privilege
        return ($currentUser['group'] == 1) ? true : false;
    }

    private function verifyPrivilege($attributes) {
        // Making sure alter is set for admin only.
        if($this->isCurrentUserAdmin() && !array_key_exists('allow_alter', $attributes)) {
            $attributes['allow_alter'] = 1;
        } else {
            $attributes['allow_alter'] = 0;
        }

        return $attributes;
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
        $attributes = $this->verifyPrivilege($attributes);
        // @todo: this should fallback on field default value
        if (!isset($attributes['status_id'])) {
            $attributes['status_id'] = 0;
        }
        $attributes = $this->getFillableFields($attributes);

        $insert = new Insert($this->getTable());
        $insert
            ->columns(array_keys($attributes))
            ->values($attributes);
        $this->insertWith($insert);

        $privilegeId = $this->lastInsertValue;

        return $this->fetchById($privilegeId);
    }

    public function getFillableFields($attributes)
    {
        return $data = array_intersect_key($attributes, array_flip($this->fillable));
    }

    // @todo This currently only supports permissions,
    // include blacklists when there is a UI for it
    public function updatePrivilege($attributes) {
        $attributes = $this->verifyPrivilege($attributes);

        $data = $this->getFillableFields($attributes);

        $update = new Update($this->getTable());
        $update->where->equalTo('id', $attributes['id']);
        $update->set($data);
        $this->updateWith($update);

        return $this->fetchById($attributes['id']);
    }

    public function fetchPerTable($groupId) {
        // Don't include tables that can't have privileges changed
        /*$blacklist = array(
            'directus_columns',
            'directus_ip_whitelist',
            'directus_messages_recipients',
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
        );*/
        $blacklist = array();


        $select = new Select($this->table);
        $select->where->equalTo('group_id', $groupId);
        $select->group(array('group_id', 'table_name', 'status_id'));
        $rowset = $this->selectWith($select);
        $rowset = $rowset->toArray();

        $tableSchema = new TableSchema();
        $tables = $tableSchema->getTablenames();
        $privileges = array();
        $privilegesHash = array();

        foreach ($rowset as $item) {
            if (in_array($item['table_name'], $blacklist)) {
                continue;
            }
            $privilegesHash[$item['table_name']] = $item;
            $privileges[] = $item;
        }

        foreach ($tables as $table) {
            if (in_array($table, $blacklist)) {
                continue;
            }
            if (array_key_exists($table, $privilegesHash)) {
              continue;
            }

            $item = array('table_name' => $table, 'group_id'=> $groupId, 'status_id' => null);

            $privileges[] = $item;
        }

        // sort ascending
        usort($privileges, function($a, $b) {
            return strcmp($a['table_name'], $b['table_name']);
        });

        return $privileges;
    }

    public function fetchGroupPrivilegesRaw($group_id) {
        $select = new Select($this->table);
        $select->where->equalTo('group_id', $group_id);
        $rowset = $this->selectWith($select);
        $rowset = $rowset->toArray();
        return $rowset;
    }

    public function findByStatus($table_name, $group_id, $status_id) {
      $select = new Select($this->table);
      $select->where
        ->equalTo('table_name', $table_name)
        ->equalTo('group_id', $group_id)
        ->equalTo('status_id', $status_id);
      $rowset = $this->selectWith($select);
      $rowset = $rowset->toArray();
      return current($rowset);
    }
}
