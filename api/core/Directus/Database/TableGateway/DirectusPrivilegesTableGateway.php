<?php

namespace Directus\Database\TableGateway;

use Directus\Database\TableSchema;
use Directus\Permissions\Acl;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Insert;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Update;

class DirectusPrivilegesTableGateway extends RelationalTableGateway
{
    public static $_tableName = 'directus_privileges';

    public $primaryKeyFieldName = 'id';

    // @todo: make this part of every table gateway
    private $fillable = [
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
    ];

    public function __construct(AdapterInterface $adapter, Acl $acl = null)
    {
        parent::__construct(self::$_tableName, $adapter, $acl);
    }

    // @TODO: move it to another object.
    private function isCurrentUserAdmin()
    {
        if (!$this->acl) {
            return true;
        }

        //Dont let non-admins have alter privilege
        return ($this->acl->getGroupId() == 1) ? true : false;
    }

    private function verifyPrivilege($attributes)
    {
        // Making sure alter is set for admin only.
        if (array_key_exists('allow_alter', $attributes)) {
            if ($this->isCurrentUserAdmin()) {
                $attributes['allow_alter'] = 1;
            } else {
                $attributes['allow_alter'] = 0;
            }
        }

        return $attributes;
    }

    /**
     * Get Permissions for the given Group ID
     * @param $groupId
     *
     * @return array
     */
    public function getGroupPrivileges($groupId)
    {
        $getPrivileges = function () use ($groupId) {
            // @TODO: Add test
            if ($groupId === 1) {
                $privileges = [
                    '*' => [
                        'allow_view' => 2,
                        'allow_add' => 1,
                        'allow_edit' => 2,
                        'allow_delete' => 2,
                        'allow_alter' => 1,
                        'read_field_blacklist' => [],
                        'write_field_blacklist' => []
                    ]
                ];
            } else {
                $privileges = $this->fetchGroupPrivileges($groupId, null);
            }

            return (array) $privileges;
        };

        // return $this->memcache->getOrCache(MemcacheProvider::getKeyDirectusGroupPrivileges($groupId), $getPrivileges, 1800);

        return $getPrivileges();
    }

    public function fetchGroupPrivileges($groupId, $statusId = false)
    {
        $select = new Select($this->table);
        $select->where->equalTo('group_id', $groupId);

        if ($statusId !== false) {
            if ($statusId === null) {
                $select->where->isNull('status_id');
            } else {
                $select->where->equalTo('status_id', $statusId);
            }
        }

        $rowset = $this->selectWith($select);
        $rowset = $rowset->toArray();

        $privilegesByTable = [];
        foreach ($rowset as $row) {
            foreach ($row as $field => &$value) {
                if ($this->acl->isTableListValue($field))
                    $value = explode(',', $value);
                $privilegesByTable[$row['table_name']] = $row;
            }
        }

        return $privilegesByTable;
    }

    public function fetchById($privilegeId)
    {
        $select = new Select($this->table);
        $select->where->equalTo('id', $privilegeId);
        $rowset = $this->selectWith($select);
        $rowset = $rowset->toArray();

        return $this->parseRecord(current($rowset));
    }

    // @todo This currently only supports permissions,
    // include blacklists when there is a UI for it
    public function insertPrivilege($attributes)
    {
        $attributes = $this->verifyPrivilege($attributes);
        // @todo: this should fallback on field default value
        if (!isset($attributes['status_id'])) {
            $attributes['status_id'] = NULL;
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
    public function updatePrivilege($attributes)
    {
        $attributes = $this->verifyPrivilege($attributes);

        $data = $this->getFillableFields($attributes);

        $update = new Update($this->getTable());
        $update->where->equalTo('id', $attributes['id']);
        $update->set($data);
        $this->updateWith($update);

        return $this->fetchById($attributes['id']);
    }

    public function fetchPerTable($groupId, $tableName = null)
    {
        // Don't include tables that can't have privileges changed
        /*$blacklist = array(
            'directus_columns',
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
        $blacklist = [];


        $select = new Select($this->table);
        $select->where->equalTo('group_id', $groupId);
        if (!is_null($tableName)) {
            $select->where->equalTo('table_name', $tableName);
            $select->limit(1);
        }
        $rowset = $this->selectWith($select);
        $rowset = $rowset->toArray();

        $tableSchema = new TableSchema();
        $tables = $tableSchema->getTablenames();
        $privileges = [];
        $privilegesHash = [];

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

            if (array_key_exists($table['name'], $privilegesHash)) {
                continue;
            }

            if (!is_null($tableName)) {
                continue;
            }

            $item = ['table_name' => $table['name'], 'group_id' => $groupId, 'status_id' => null];

            $privileges[] = $item;
        }

        // sort ascending
        usort($privileges, function ($a, $b) {
            return strcmp($a['table_name'], $b['table_name']);
        });

        $privileges = is_null($tableName) ? $privileges : reset($privileges);

        return $this->parseRecord($privileges);
    }

    public function fetchGroupPrivilegesRaw($group_id)
    {
        $select = new Select($this->table);
        $select->where->equalTo('group_id', $group_id);
        $rowset = $this->selectWith($select);
        $rowset = $rowset->toArray();

        return $this->parseRecord($rowset);
    }

    public function findByStatus($table_name, $group_id, $status_id)
    {
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
