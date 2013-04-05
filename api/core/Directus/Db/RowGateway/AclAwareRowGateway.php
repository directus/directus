<?php

namespace Directus\Db\RowGateway;

use Zend\Db\RowGateway\RowGateway;

use Directus\Bootstrap;
use Directus\Acl;

class AclAwareRowGateway extends RowGateway {

    protected $aclProvider;

    /**
     * Constructor
     * @param AclProvider $aclProvider
     * @param string $primaryKeyColumn
     * @param string|\Zend\Db\Sql\TableIdentifier $table
     * @param Adapter|Sql $adapterOrSql
     * @throws Exception\InvalidArgumentException
     */
    public function __construct(Acl $aclProvider, $primaryKeyColumn, $table, $adapterOrSql) {
        $this->aclProvider = $aclProvider;
        parent::__construct($primaryKeyColumn, $table, $adapterOrSql);
    }

    // as opposed to toArray()
    // used only for proof of concept
    public function __getUncensoredDataForTesting() {
        return $this->data;
    }

	private function logger() {
		return Bootstrap::get('app')->getLog();
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

        $censorFields = $this->aclProvider->getTableList($this->table, Acl::READ_BLACKLIST);
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
        $data = $this->aclProvider->censorFields($this->table, $this->data);
        return $data;
    }

}