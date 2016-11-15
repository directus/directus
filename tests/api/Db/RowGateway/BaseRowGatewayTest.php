<?php

class BaseRowGatewayTest extends PHPUnit_Framework_TestCase
{
    protected $data = [];

    public function setUp()
    {
        $this->data = [
            'title' => 'Vacation',
            'date_uploaded' => '2016-08-10 11:29:34',
            'type' => 'image/jpg'
        ];
    }

    public function testPopulate()
    {
        $data = $this->data;

        // (skip) row does not exists in the database
        $row = $this->getRow();
        $row->populateSkipAcl($data, false);

        $this->assertSame($data, $row->toArray());
        $this->assertFalse($row->rowExistsInDatabase());

        // (skip) row does exists in the database
        $row = $this->getRow();
        $row->populateSkipAcl(array_merge(['id' => 1], $data), true);

        $this->assertSame(array_merge(['id' => 1], $data), $row->toArray());
        $this->assertTrue($row->rowExistsInDatabase());

        // row does not exists in the database
        $row = $this->getRow();
        $row->populate($data, false);

        $this->assertSame($data, $row->toArray());
        $this->assertFalse($row->rowExistsInDatabase());

        // row does exists in the database
        $row = $this->getRow();
        $row->populate(array_merge(['id' => 1], $data), true);

        $this->assertSame(array_merge(['id' => 1], $data), $row->toArray());
        $this->assertTrue($row->rowExistsInDatabase());

        $row = $this->getRow();
        $result = $row->exchangeArray(array_merge(['id' => 1], $data));
        $this->assertSame(array_merge(['id' => 1], $data), $result->toArray());
        $this->assertTrue($row->rowExistsInDatabase());
    }

    public function testProperties()
    {
        $data = array_merge(['id' => 1], $this->data);

        $row = $this->getRow();

        $row->populate($data, true);

        $this->assertSame(4, $row->count());
        $this->assertSame('Vacation', $row->title);
        $this->assertSame('Vacation', $row['title']);

        $row['title'] = 'Vacation 2016';
        $this->assertSame('Vacation 2016', $row['title']);

        // removing an attribute value
        $this->assertTrue(isset($row['title']));
        unset($row['title']);
        $this->assertNull($row['title']);
        $this->assertTrue(isset($row['title']));
    }

    /**
     * @expectedException Directus\Permissions\Exception\UnauthorizedFieldReadException
     */
    public function testGetException()
    {
        $row = $this->getRowPrivileges();
        $date = $row['date_uploaded'];
    }

    /**
     * @expectedException Directus\Permissions\Exception\UnauthorizedFieldReadException
     */
    public function testOffsetGetException()
    {
        $row = $this->getRowPrivileges();
        $date = $row->date_uploaded;
    }

    /**
     * @expectedException Directus\Permissions\Exception\UnauthorizedFieldWriteException
     */
    public function testUnsetException()
    {
        $row = $this->getRowPrivileges();
        unset($row['type']);
    }

    /**
     * @expectedException Directus\Permissions\Exception\UnauthorizedFieldWriteException
     */
    public function testSetException()
    {
        $row = $this->getRowPrivileges();
        $row['type'] = 'unknown';
    }

    /**
     * @expectedException \Zend\Db\RowGateway\Exception\RuntimeException
     */
    public function testPrimaryKeyException()
    {
        $row = $this->getRow();

        $row->populateSkipAcl($this->data, true);
    }

    public function testMakeRowGateway()
    {
        $row = $this->getRow();

        $acl = new Directus\Permissions\Acl();
        $adapter = get_mock_adapter($this);
        $newRow = $row->makeRowGatewayFromTableName('id', 'directus_users', $adapter, $acl);
        $this->assertInstanceOf('\Directus\Database\RowGateway\DirectusUsersRowGateway', $newRow);

        $newRow = $row->makeRowGatewayFromTableName('id', 'directus_files', $adapter, $acl);
        $this->assertInstanceOf('\Directus\Database\RowGateway\BaseRowGateway', $newRow);
    }

    public function testStringifyPrimaryKey()
    {
        $row = $this->getRow();

        $this->assertInternalType('string', $row->stringifyPrimaryKeyForRecordDebugRepresentation(['id']));
        $this->assertInternalType('string', $row->stringifyPrimaryKeyForRecordDebugRepresentation([]));
    }

    public function testPreSaveHook()
    {
        $row = $this->getRow();

        $data = ['data' => 1];
        $this->assertSame($data, $row->preSaveDataHook($data));
    }

    public function testDelete()
    {
        $row = $this->getRow();

        $row->populate($this->getDataWithID(), true);

//        $affectedRows = $row->delete();
//        $this->assertSame(1, $affectedRows);
//        $this->assertFalse($row->existsInDatabase());
    }

    protected function getRow($tableName = 'users', $privileges = [])
    {
        $adapter = get_mock_adapter($this);
        $acl = new Directus\Permissions\Acl($privileges);
        $row = new \Directus\Database\RowGateway\BaseRowGateway('id', $tableName, $adapter, $acl);

        $acl->setUserId(1);
        $acl->setGroupId(1);

        return $row;
    }

    protected function getRowPrivileges($tableName = 'directus_files')
    {
        $row = $this->getRow($tableName, [
            'directus_files' => [
                'id' => 1,
                'table_name' => 'directus_files',
                'group_id' => 1,
                'read_field_blacklist' => ['date_uploaded'],
                'write_field_blacklist' => ['type'],
                'nav_listed' => 1,
                'status_id' => 0,
                'allow_view' => 2,
                'allow_add' => 1,
                'allow_edit' => 2,
                'allow_delete' => 2,
                'allow_alter' => 1
            ]
        ]);

        $row->populate($this->data);

        return $row;
    }

    protected function getData($withId = false)
    {
        return $withId ? array_merge(['id' => 1], $this->data) : $this->data;
    }

    protected function getDataWithId()
    {
        return $this->getData(true);
    }
}
