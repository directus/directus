<?php

namespace Directus\Acl;

use Directus\Acl\Exception\UnauthorizedFieldWriteException;
use Directus\Acl\Exception\UnauthorizedFieldReadException;
use Directus\Bootstrap;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Zend\Db\RowGateway\RowGateway;
use Zend\Db\Sql\Predicate\PredicateSet;
use Zend\Db\Sql\Select;

class Acl {

    const TABLE_PERMISSIONS     = "permissions";
    const FIELD_READ_BLACKLIST  = "read_field_blacklist";
    const FIELD_WRITE_BLACKLIST = "write_field_blacklist";

    /**
     * The magic Directus column identifying the record's CMS owner.
     * NOTE: Out of use, in favor of the transitional mapper below.
     * @see  self::$cms_owner_columns_by_table and self#getRecordCmsOwnerId
     */
    const ROW_OWNER_COLUMN = "directus_user";

    public static $cms_owner_columns_by_table = array(
        'directus_files' => 'user',
        'directus_users' => 'id'
    );

    /**
     * Baseline/fallback ACL
     * @var array
     */
    public static $base_acl = array(
        self::TABLE_PERMISSIONS     => array('add','edit','delete','view'),
        self::FIELD_READ_BLACKLIST  => array(),
        self::FIELD_WRITE_BLACKLIST => array()
    );

    /**
     * These fields cannot be included on any FIELD_READ_BLACKLIST. (It is required
     * that they are readable in order for the application to function.)
     * @var array
     */
    public static $mandatory_read_lists = array(
        // key: table name ('*' = all tables, baseline definition)
        // value: array of column names
        '*'                 => array('id',STATUS_COLUMN_NAME),
        'directus_activity' => array('user'),
        'directus_files'    => array('user')
    );

    protected $groupPrivileges;
    protected $userId = "null";
    protected $groupId = "null";

    public function __construct(array $groupPrivileges = array()) {
        $this->setGroupPrivileges($groupPrivileges);
    }

    public function setUserId($userId) {
        $this->userId = $userId;
    }

    public function setGroupId($groupId) {
        $this->groupId = $groupId;
    }

    public function getUserId() {
        return $this->userId;
    }

    public function getGroupId() {
        return $this->groupId;
    }

    public function logger() {
        return Bootstrap::get('app')->getLog();
    }

    public function setGroupPrivileges(array $groupPrivileges) {
        $this->groupPrivileges = $groupPrivileges;
        return $this;
    }

    public function getGroupPrivileges() {
        return $this->groupPrivileges;
    }

    public function isTableListValue($value) {
        return array_key_exists($value, self::$base_acl);
    }

    public function getTableMandatoryReadList($table) {
        $list = self::$mandatory_read_lists['*'];
        if(array_key_exists($table, self::$mandatory_read_lists)) {
            $list = array_merge($list, self::$mandatory_read_lists[$table]);
        }
        return $list;
    }

    public function getErrorMessagePrefix() {
        // %s and not %d so that null will appear as "null"
        $aclErrorPrefix = "[".__t('group')." #%s ".__t('user')." #%s] ";
        $aclErrorPrefix = sprintf($aclErrorPrefix, $this->getGroupId(), $this->getUserId());
        return $aclErrorPrefix;
    }

    /**
     * Confirm current user group has $blacklist privileges on fields in $offsets
     * NOTE: Acl#getTablePrivilegeList enforces that $blacklist is a correct value
     * @param  array|string $offsets  One or more string table field names
     * @param  integer $blacklist  One of \Directus\Acl\Acl's blacklist constants
     * @throws  UnauthorizedFieldWriteException If the specified $offsets intersect with $table's field write blacklist
     * @throws  UnauthorizedFieldReadException If the specified $offsets intersect with $table's field read blacklist
     * @return  null
     */
    public function enforceBlacklist($table, $offsets, $blacklist) {
        $offsets = is_array($offsets) ? $offsets : array($offsets);
        $fieldBlacklist = $this->getTablePrivilegeList($table, $blacklist);
        /**
         * Enforce catch-all offset attempts.
         */
        if(self::FIELD_READ_BLACKLIST === $blacklist && count($fieldBlacklist) && in_array('*', $offsets)) {
            // Cannot select all, given a non-empty field read blacklist.
            $prefix = $this->getErrorMessagePrefix();
            throw new UnauthorizedFieldReadException($prefix . __t('cannot_select_all_from_table_x_with_nonempty_read_field_blacklist', [
                    'table' => $table
            ]));
        }
        /**
         * Enforce granular offset attempts.
         * NOTE: array_intersect attempts to convert all array items to a string, causing exceptions
         * if $offsets contains objects such as Zend\Db\Sql\Expression
         * @todo How should ACL react to Expression objects?
         */
        $forbiddenIndices = array();
        foreach($offsets as $offset) {
            if(in_array($offset, $fieldBlacklist)) {
                $forbiddenIndices[] = $offset;
            }
        }
        if(count($forbiddenIndices)) {
            $forbiddenIndices = implode(", ", $forbiddenIndices);
            switch($blacklist) {
                case self::FIELD_WRITE_BLACKLIST:
                    $prefix = $this->getErrorMessagePrefix();
                    throw new UnauthorizedFieldWriteException($prefix . __t('write_access_forbidden_to_table_x_indices_y', [
                            'table' => $table,
                            'indices' => $forbiddenIndices
                    ]));
                case self::FIELD_READ_BLACKLIST:
                    $prefix = $this->getErrorMessagePrefix();
                    throw new UnauthorizedFieldWriteException($prefix . __t('read_access_forbidden_to_table_x_indices_y', [
                            'table' => $table,
                            'indices' => $forbiddenIndices
                    ]));
            }
        }
    }

    /**
     * Given the loaded group privileges, yield the given privilege-/black-list type for the given table.
     * @param  string $table Table name.
     * @param  integer $list  The privilege list type (Class constant, ::FIELD_*_BLACKLIST or ::TABLE_PERMISSIONS)
     * @return array Array of string table privileges / table blacklist fields, depending on $list.
     * @throws  \InvalidArgumentException If $list is not a known value.
     */
    public function getTablePrivilegeList($table, $list) {
        if(!$this->isTableListValue($list)) {
            throw new \InvalidArgumentException(__t('invalid_list_x', ['list' => $list]));
        }
        $privilegeList = self::$base_acl[$list];
        $groupHasTablePrivileges = array_key_exists($table, $this->groupPrivileges);
        // @TODO: remove permissions.
        if ($list === 'permissions') {
            $permissionFields = array_merge(self::$base_acl[self::TABLE_PERMISSIONS], array(
                'alter'
            ));
            $permissionFields = array_map(function($name) {
                return 'allow_' . $name;
            }, $permissionFields);

            if ($groupHasTablePrivileges) {
                $privilegeList = array_intersect_key($this->groupPrivileges[$table], array_flip($permissionFields));
            } else {
                $privilegeList = array();
                foreach($permissionFields as $permission) {
                    $privilegeList[$permission] = 1;
                }
            }

            return $privilegeList;
        }

        if($groupHasTablePrivileges) {
            if(!isset($this->groupPrivileges[$table][$list]) || !is_array($this->groupPrivileges[$table][$list])) {
                throw new \RuntimeException(__t('expected_permission_list_x_for_table_y_to_be_set_and_type_array', [
                    'list' => $list,
                    'table' => $table
                ]));
            }
            $privilegeList = $this->groupPrivileges[$table][$list];
        } else {
            $groupHasFallbackTablePrivileges = array_key_exists('*', $this->groupPrivileges);
            if($groupHasFallbackTablePrivileges) {
                if(!isset($this->groupPrivileges['*'][$list]) || !is_array($this->groupPrivileges['*'][$list])) {
                    throw new \RuntimeException(__t('expected_permission_list_x_for_table_y_to_be_set_and_type_array', [
                        'list' => $list,
                        'table' => $table
                    ]));
                }
                $privilegeList = $this->groupPrivileges['*'][$list];
            }
        }

        if(self::FIELD_READ_BLACKLIST === $privilegeList) {
            // Filter mandatory read fields from read blacklists
            $mandatoryReadFields = $this->getTableMandatoryReadList($table);
            $disallowedReadBlacklistFields = array_intersect($mandatoryReadFields, $privilegeList);
            if(count($disallowedReadBlacklistFields)) {
                trigger_error(
                    __t('table_x_contains_read_blacklist_items_which_are_designated_as_mandatory_read_fields', ['table' => $table])
                    .": ".print_r($disallowedReadBlacklistFields, true)
                );
                // Filter out mandatory read items
                $privilegeList = array_diff($privilegeList, $mandatoryReadFields);
            }
        }

        // Remove null values
        return array_filter($privilegeList);
    }

    public function censorFields($table, $data) {
        $censorFields = $this->getTablePrivilegeList($table, self::FIELD_READ_BLACKLIST);
        foreach($censorFields as $key) {
            if(array_key_exists($key, $data)) {
                unset($data[$key]);
            }
        }
        return $data;
    }

    /**
     * Given table name $table and privilege constant $privilege, return boolean
     * value indicating whether the current user group has permission to perform
     * the specified table-level action on the specified table.
     * @param  string  $table     Table name
     * @param  string  $privilege Privilege constant defined by \Directus\Acl\Acl
     * @return boolean
     */
    public function hasTablePrivilege($table, $privilege) {
        $tablePermissions = $this->getTablePrivilegeList($table, self::TABLE_PERMISSIONS);
        $permissionLevel = 1;
        $permissionName = $privilege;

        if (strpos($privilege, 'big') === 0) {
            $permissionLevel = 2;
            $permissionName = substr($privilege, 3);
        }

        if (isset($tablePermissions['allow_' . $permissionName])) {
            return  $permissionLevel <= $tablePermissions['allow_' . $permissionName];
        }

        return false;
    }

    public function getCmsOwnerColumnByTable($table) {
        if(!array_key_exists($table, self::$cms_owner_columns_by_table)) {
            return false;
        }
        return self::$cms_owner_columns_by_table[$table];
    }

    /**
     * Given $record, yield the ID contained by that $table's CMS owner column,
     * if one exists. Otherwise return false.
     * @param  Zend\Db\RowGateway\RowGateway|array  $record
     * @param  string $table  The name of the record's table.
     * @return int|false
     */
    public function getRecordCmsOwnerId($record, $table) {
        $isRowGateway = $record instanceof RowGateway || is_subclass_of($record, "Zend\Db\RowGateway\RowGateway");
        if(!($isRowGateway || is_array($record))) {
            // TODO: get_class only works on object
            // if $record is an array get_class will return false
            throw new \InvalidArgumentException('record_must_be_array_or_rowgateway_x_given', [
                'type' => get_class($record)
            ]);
        }
        $ownerColumnName = $this->getCmsOwnerColumnByTable($table);
        if(false === $ownerColumnName) {
            return false;
        }
        if($isRowGateway && !$record->offsetExists($ownerColumnName)) {
            return false;
        } elseif(is_array($record) && !array_key_exists($ownerColumnName, $record)) {
            return false;
        }
        return (int) $record[$ownerColumnName];
    }

    public function getCmsOwnerIdsByTableGatewayAndPredicate(AclAwareTableGateway $TableGateway, PredicateSet $predicate) {
        $ownerIds = array();
        $table = $TableGateway->getTable();
        $cmsOwnerColumn = $this->getCmsOwnerColumnByTable($table);
        $select = new Select($table);
        $select
            ->columns(array($TableGateway->primaryKeyFieldName, $cmsOwnerColumn))
            ->group($cmsOwnerColumn);
        $select->where($predicate);
        $results = $TableGateway->selectWith($select);
        foreach($results as $row) {
            $ownerIds[] = $row[$cmsOwnerColumn];
        }
        return array(count($results), $ownerIds);
    }

}
