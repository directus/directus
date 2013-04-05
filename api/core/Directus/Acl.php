<?php

namespace Directus;

use Directus\Bootstrap;

class Acl {

    const READ_BLACKLIST = "read_field_blacklist";
    const READ_MANDATORY_LIST = "mandatory_field_whitelist";
    const WRITE_BLACKLIST = "write_field_blacklist";

    public static $base_acl = array(
        self::READ_BLACKLIST => array(),
        self::READ_MANDATORY_LIST => array('id','active'),
        self::WRITE_BLACKLIST => array()
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

    public function getTableList($table, $list) {
        if(!$this->isTableListValue($list))
            throw new \InvalidArgumentException("Invalid list: $list");
        $listItems = self::$base_acl[$list];
        // @todo shouldn't necessarily have to check for the presence of the list
        if(array_key_exists($table, $this->groupPrivileges) && array_key_exists($list, $this->groupPrivileges[$table]))
            $listItems = array_merge($listItems, $this->groupPrivileges[$table][$list]);
        return $listItems;
    }

    public function censorFields($table, $data) {
        $censorFields = $this->getTableList($table, self::READ_BLACKLIST);
        foreach($censorFields as $key) {
            if(array_key_exists($key, $data))
                unset($data[$key]);
        }
        return $data;
    }

}