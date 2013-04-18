<?php

namespace Directus\Acl;

use Directus\Bootstrap;
use Zend\Db\RowGateway\RowGateway;

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
        'directus_media' => 'user',
        'directus_users' => 'id'
    );

    /**
     * Baseline/fallback ACL
     * @var array
     */
    public static $base_acl = array(
        self::TABLE_PERMISSIONS     => array('add','edit','delete'),
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
        '*'                 => array('id','active'),
        'directus_activity' => array('user'),
        'directus_media'    => array('user')
    );

    protected $groupPrivileges;

    public function __construct(array $groupPrivileges = array()) {
        $this->setGroupPrivileges($groupPrivileges);
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
        if(array_key_exists($table, self::$mandatory_read_lists))
            $list = array_merge($list, self::$mandatory_read_lists[$table]);
        return $list;
    }

    /**
     * Confirm current user group has $blacklist privileges on fields in $offsets
     * @param  array|string $offsets  One or more string table field names
     * @param  integer $blacklist  One of \Directus\Acl\Acl's blacklist constants
     * @throws  UnauthorizedFieldWriteException If the specified $offsets intersect with $table's field write blacklist
     * @throws  UnauthorizedFieldReadException If the specified $offsets intersect with $table's field read blacklist
     * @return  null
     */
    public function enforceBlacklist($table, $offsets, $blacklist) {
        $offsets = is_array($offsets) ? $offsets : array($offsets);
        // Acl#getTablePrivilegeList enforces that $blacklist is a correct value
        $fieldBlacklist = $this->getTablePrivilegeList($table, $blacklist);
        $forbiddenIndices = array_intersect($offsets, $fieldBlacklist);
        if(count($forbiddenIndices)) {
            $forbiddenIndices = implode(", ", $forbiddenIndices);
            switch($blacklist) {
                case Acl::FIELD_WRITE_BLACKLIST:
                    throw new UnauthorizedFieldWriteException("Write (set) access forbidden to table \"{$table}\" indices: $forbiddenIndices");
                case Acl::FIELD_READ_BLACKLIST:
                    throw new UnauthorizedFieldReadException("Read (get) access forbidden to table \"{$table}\" indices: $forbiddenIndices");
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
        if(!$this->isTableListValue($list))
            throw new \InvalidArgumentException("Invalid list: $list");
        $privilegeList = self::$base_acl[$list];
        $tableHasGroupPrivileges = array_key_exists($table, $this->groupPrivileges);
        if($tableHasGroupPrivileges) {
            $groupTableList = $this->groupPrivileges[$table][$list];
            switch($list) {
                // Replace base table permissions with group table permissions
                case self::TABLE_PERMISSIONS:
                    $privilegeList = $groupTableList;
                    break;
                // Merge in the table-specific read blacklist, if one exists
                case self::FIELD_READ_BLACKLIST:
                case self::FIELD_WRITE_BLACKLIST:
                default:
                    $privilegeList = array_merge($privilegeList, $groupTableList);
                    break;
            }
        }
        // Filter mandatory read fields from read blacklists
        $mandatoryReadFields = $this->getTableMandatoryReadList($table);
        $disallowedReadBlacklistFields = array_intersect($mandatoryReadFields, $privilegeList);
        if(count($disallowedReadBlacklistFields)) {
            // Log warning
            $this->logger()->warn("Table $table contains read blacklist items which are designated as mandatory read fields:");
            $this->logger()->warn(print_r($disallowedReadBlacklistFields, true));
            // Filter out mandatory read items
            $privilegeList = array_diff($privilegeList, $mandatoryReadFields);
        }

        return $privilegeList;
    }

    public function censorFields($table, $data) {
        $censorFields = $this->getTablePrivilegeList($table, self::FIELD_READ_BLACKLIST);
        foreach($censorFields as $key) {
            if(array_key_exists($key, $data))
                unset($data[$key]);
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
        return in_array($privilege, $tablePermissions);
    }

    public function getCmsOwnerColumnByTable($table) {
        if(!array_key_exists($table, self::$cms_owner_columns_by_table))
            return false;
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
        if(!($isRowGateway || is_array($record)))
            throw new \InvalidArgumentException("Parameter must be either an array or an instance/subclass of Zend\Db\RowGateway\RowGateway");
        $ownerColumnName = $this->getCmsOwnerColumnByTable($table);
        if(false === $ownerColumnName)
            return false;
        if($isRowGateway && !$record->offsetExists($ownerColumnName))
            return false;
        elseif(is_array($record) && !array_key_exists($ownerColumnName, $record))
            return false;
        return (int) $record[$ownerColumnName];
    }

}
