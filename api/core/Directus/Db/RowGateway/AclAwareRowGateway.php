<?php

namespace Directus\Db\RowGateway;

use Zend\Db\RowGateway\RowGateway;

use Directus\Application;

class AclAwareRowGateway extends RowGateway {

    const READ_BLACKLIST = "read_field_blacklist";
    const READ_MANDATORY_LIST = "mandatory_field_whitelist";

    public static $mock_acl = array(
        '*' => array(
            self::READ_BLACKLIST => array(),
            self::READ_MANDATORY_LIST => array('id','active')
        ),
        'directus_media' => array(
            self::READ_BLACKLIST => array(
                //'size',// 'active'
            )
        )
    );

    // as opposed to toArray()
    // used only for proof of concept
    public function __getUncensoredDataForTesting() {
        return $this->data;
    }

    public function getTableReadBlacklist($table, $group = null) {
        $readBlacklist = self::$mock_acl['*'][self::READ_BLACKLIST];
        if(array_key_exists($table, self::$mock_acl) && array_key_exists(self::READ_BLACKLIST, self::$mock_acl[$table]))
            $readBlacklist = array_merge($readBlacklist, self::$mock_acl[$table][self::READ_BLACKLIST]);
        return $readBlacklist;
    }

    private function censorFields($data) {
        $censorFields = $this->getTableReadBlacklist($this->table);
        foreach($censorFields as $key) {
            if(array_key_exists($key, $data))
                unset($data[$key]);
        }
        return $data;
    }

	private function logger() {
		return Application::getApp()->getLog();
	}

    /**
     * Populate Data
     *
     * @param  array $rowData
     * @param  bool  $rowExistsInDatabase
     * @return AbstractRowGateway
     */
    public function populate(array $rowData, $rowExistsInDatabase = false)
    {
        // ...

        return parent::populate($rowData, $rowExistsInDatabase);
    }

    /**
     * Offset Exists
     *
     * @param  string $offset
     * @return bool
     */
    public function offsetExists($offset)
    {
        // Filter censored fields
        $censoredData = $this->toArray();
        return array_key_exists($offset, $censoredData);
    }

    /**
     * @return int
     */
    public function count()
    {
        // Don't include censored fields in the field count
        $censoredData = $this->toArray();
        return count($censoredData);
    }

    /**
     * __get
     *
     * @param  string $name
     * @return mixed
     */
    public function __get($name)
    {
        $censoredData = $this->toArray();
        if (array_key_exists($name, $censoredData)) {
            return $censoredData[$name];
        } else {
            throw new \InvalidArgumentException('Not a valid column in this row: ' . $name);
        }
    }

	/**
     * Offset get
     *
     * @param  string $offset
     * @return mixed
     */
    public function offsetGet($offset)
    {
        // - confirm user group has read privileges on field with name $offset
        // ...

        $censorFields = $this->getTableReadBlacklist($this->table);
        if(in_array($offset, $censorFields))
            throw new \ErrorException("Undefined index: $offset");

        return parent::offsetGet($offset);
    }

    /**
     * Offset set
     *
     * @param  string $offset
     * @param  mixed $value
     * @return RowGateway
     */
    public function offsetSet($offset, $value)
    {
        // - confirm user group has write privileges on field with name $offset
        // ...

        return parent::offsetSet($offset, $value);
    }

    /**
     * Offset unset
     *
     * @param  string $offset
     * @return AbstractRowGateway
     */
    public function offsetUnset($offset)
    {
        // - confirm user group has write privileges on field with name $offset
        // ...

        return parent::offsetUnset($offset);
    }

    /**
     * To array
     *
     * @return array
     */
    public function toArray()
    {
    	// ... omit the fields we can't read
        $data = $this->censorFields($this->data);
        return $data;
    }

}