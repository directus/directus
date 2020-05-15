<?php

namespace Directus\Database\TableGateway;

use Directus\Database\SchemaService;
use Directus\Permissions\Acl;
use Directus\Util\ArrayUtils;
use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Sql\Insert;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Update;

class DirectusPermissionsTableGateway extends RelationalTableGateway
{
    public static $_tableName = 'directus_permissions';

    public $primaryKeyFieldName = 'id';

    // @todo: make this part of every table gateway
    // TODO: based this on the collection object whitelist fields
    private $fillable = [
        'collection',
        'role',
        'status',
        'status_blacklist',
        'create',
        'read',
        'update',
        'delete',
        'comment',
        'explain',
        'read_field_blacklist',
        'write_field_blacklist'
    ];

    public function __construct(AdapterInterface $adapter, Acl $acl = null)
    {
        parent::__construct(self::$_tableName, $adapter, $acl);
    }

    public function getUserPermissions($userId)
    {
        $select = new Select(['p' => $this->table]);

        $subSelect = new Select(['ur' => 'directus_users']);
        $subSelect->where->equalTo('ur.id', $userId);
        $subSelect->limit(1);

        $select->join(
            ['ur' => $subSelect],
            'p.role = ur.role',
            [
                'role'
            ],
            $select::JOIN_RIGHT
        );

        $select->where->equalTo('ur.id', $userId);

        $statement = $this->sql->prepareStatementForSqlObject($select);
        $result = $statement->execute();

        return $this->parsePermissions($result);
    }

    public function getRolePermissions($roleId)
    {
        $select = new Select($this->table);
        $select->where->equalTo('role', $roleId);

        $statement = $this->sql->prepareStatementForSqlObject($select);
        $result = $statement->execute();

        return $this->parsePermissions($result);
    }

    protected function parsePermissions($result)
    {
        $permissionsByCollection = [];
        foreach ($result as $permission) {
            foreach ($permission as $field => &$value) {
                if (in_array($field, ['read_field_blacklist', 'write_field_blacklist'])) {
                    $value = array_filter(explode(',', $value));
                }
            }

            $permissionsByCollection[$permission['collection']][] = $this->parseRecord($permission);
        }

        return $permissionsByCollection;
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
        return $this->fetchGroupPrivileges($groupId);
    }

    public function fetchGroupPrivileges($groupId, $statusId = false)
    {
        $select = new Select($this->table);
        $select->where->equalTo('group', $groupId);

        if ($statusId !== false) {
            if ($statusId === null) {
                $select->where->isNull('status');
            } else {
                $select->where->equalTo('status', $statusId);
            }
        }

        $rowset = $this->selectWith($select);
        $rowset = $rowset->toArray();

        $privilegesByTable = [];
        foreach ($rowset as $row) {
            foreach ($row as $field => &$value) {
                if (in_array($field, ['read_field_blacklist', 'write_field_blacklist'])) {
                    $value = explode(',', $value);
                }
            }

            $privilegesByTable[$row['collection']][] = $this->parseRecord($row);
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

    public function fetchPerTable($groupId, $tableName = null, array $columns = [])
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
        if (!empty($columns)) {
            // Force the primary key
            // It's going to be removed below
            $select->columns(array_merge([$this->primaryKeyFieldName], $columns));
        }

        $select->where->equalTo('group', $groupId);
        if (!is_null($tableName)) {
            $select->where->equalTo('collection', $tableName);
            $select->limit(1);
        }
        $rowset = $this->selectWith($select);
        $rowset = $rowset->toArray();

        $tableSchema = new SchemaService();
        $tables = $tableSchema->getTablenames();
        $privileges = [];
        $privilegesHash = [];

        foreach ($rowset as $item) {
            if (in_array($item['collection'], $blacklist)) {
                continue;
            }

            if (!empty($columns)) {
                $item = ArrayUtils::pick($item, $columns);
            }

            $privilegesHash[$item['collection']] = $item;
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

            $item = ['collection' => $table['name'], 'group' => $groupId, 'status_id' => null];

            $privileges[] = $item;
        }

        // sort ascending
        usort($privileges, function ($a, $b) {
            return strcmp($a['collection'], $b['collection']);
        });

        $privileges = is_null($tableName) ? $privileges : reset($privileges);

        return $this->parseRecord($privileges);
    }

    public function fetchGroupPrivilegesRaw($group_id)
    {
        $select = new Select($this->table);
        $select->where->equalTo('group', $group_id);
        $rowset = $this->selectWith($select);
        $rowset = $rowset->toArray();

        return $this->parseRecord($rowset);
    }

    public function findByStatus($collection, $group_id, $status_id)
    {
        $select = new Select($this->table);
        $select->where
            ->equalTo('collection', $collection)
            ->equalTo('group', $group_id)
            ->equalTo('status', $status_id);
        $rowset = $this->selectWith($select);
        $rowset = $rowset->toArray();
        return current($rowset);
    }
}
