<?php

namespace Directus\Acl;

use Directus\Bootstrap;

class Acl {

    const TABLE_PERMISSIONS     = "table_permissions";
    const FIELD_READ_BLACKLIST  = "read_field_blacklist";
    const FIELD_WRITE_BLACKLIST = "write_field_blacklist";

    /**
     * Baseline/fallback ACL
     * @var array
     */
    public static $base_acl = array(
        self::TABLE_PERMISSIONS     => array('add','edit','delete'), //array('edit','delete'),
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
        '*' => array('id','active')
        // ...
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

    public function getTablePrivilegeList($table, $list) {
        if(!$this->isTableListValue($list))
            throw new \InvalidArgumentException("Invalid list: $list");
        $blacklistItems = self::$base_acl[$list];

        // Merge in the table-specific read blacklist, if one exists
        if(array_key_exists($table, $this->groupPrivileges))
            $blacklistItems = array_merge($blacklistItems, $this->groupPrivileges[$table][$list]);

        // Filter mandatory read fields from read blacklists
        $mandatoryReadFields = $this->getTableMandatoryReadList($table);
        $disallowedReadBlacklistFields = array_intersect($mandatoryReadFields, $blacklistItems);
        if(count($disallowedReadBlacklistFields)) {
            // Log warning
            $this->logger()->warn("Table $table contains read blacklist items which are designated as mandatory read fields:");
            $this->logger()->warn(print_r($disallowedReadBlacklistFields, true));
            // Filter out mandator read items
            $blacklistItems = array_diff($blacklistItems, $mandatoryReadFields);
        }

        return $blacklistItems;
    }

    public function censorFields($table, $data) {
        $censorFields = $this->getTablePrivilegeList($table, self::FIELD_READ_BLACKLIST);
        foreach($censorFields as $key) {
            if(array_key_exists($key, $data))
                unset($data[$key]);
        }
        return $data;
    }

    public function hasTablePrivilege($table, $privilege) {
        $tablePermissions = $this->getTablePrivilegeList($table, self::TABLE_PERMISSIONS);
        return in_array($privilege, $tablePermissions);
    }

}