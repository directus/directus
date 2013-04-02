<?php

namespace Directus\Db\RowGateway;

use Zend\Db\RowGateway\RowGateway;

use Directus\Application;

class AclAwareRowGateway extends RowGateway {

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
     * Offset get
     *
     * @param  string $offset
     * @return mixed
     */
    public function offsetGet($offset)
    {
        // - confirm user group has read privileges on field with name $offset
        // ...

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

        return parent::offsetUnset($offset, $value);
    }

    /**
     * To array
     *
     * @return array
     */
    public function toArray()
    {
    	// ... omit the fields we can't read

        return $this->data;
    }

}