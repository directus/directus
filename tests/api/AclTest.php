<?php

use Directus\Permissions\Acl;

class AclTest extends PHPUnit_Framework_TestCase
{
    /**
     * @var \Directus\Permissions\Acl null
     */
    protected $acl = null;
    protected $privileges = null;

    public function setUp()
    {
        $this->acl = new Acl();
        $this->privileges = [
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
            ],
            'test_table' => [
                'id' => 2,
                'table_name' => 'test_table',
                'group_id' => 1,
                'read_field_blacklist' => null,
                'write_field_blacklist' => null,
                'nav_listed' => 1,
                'status_id' => 0,
                'allow_view' => 1,
                'allow_add' => 1,
                'allow_edit' => 1,
                //'allow_delete' => 1,
                'allow_alter' => 1
            ],
            'forbid' => [
                'id' => 3,
                'table_name' => 'test_table',
                'group_id' => 1,
                'read_field_blacklist' => null,
                'write_field_blacklist' => null,
                'nav_listed' => 1,
                'status_id' => 0,
                'allow_view' => 0,
                'allow_add' => 0,
                'allow_edit' => 0,
                'allow_delete' => 0,
                'allow_alter' => null
            ],
            '*' => [
                'id' => 3,
                'table_name' => '*',
                'group_id' => 1,
                'read_field_blacklist' => ['active'],
                'write_field_blacklist' => null,
                'nav_listed' => 1,
                'status_id' => 0,
                'allow_view' => 2,
                'allow_add' => 1,
                'allow_edit' => 2,
                'allow_delete' => 2,
                'allow_alter' => null
            ],
            'directus_preferences' => [
                'allow_add' => 1,
                'allow_view' => 1,
                'allow_edit' => 1
            ]
        ];

        $this->acl->setGroupPrivileges($this->privileges);
        $this->acl->setUserId(1);
        $this->acl->setGroupId(1);
    }

    public function testGroupPrivileges()
    {
        $acl = new Acl($this->privileges);
        $privileges = $acl->getGroupPrivileges();

        $this->assertEquals($privileges, $this->privileges);
        $this->assertTrue(count($acl->getGroupPrivileges()) > 0);
        $this->assertArrayHasKey('directus_files', $privileges);
        $this->assertArrayNotHasKey('directus_users', $privileges);

        $acl->setGroupPrivileges([]);
        $this->assertTrue(!empty($acl->getGroupPrivileges()));
        $this->assertTrue(!empty($acl->getGroupPrivileges()));
        $this->assertCount(1, $acl->getGroupPrivileges());

        $acl->setGroupPrivileges($this->privileges);
        $privileges = $acl->getGroupPrivileges();
        $this->assertEquals($privileges, $this->privileges);
        $this->assertTrue(count($acl->getGroupPrivileges()) > 0);
        $this->assertArrayHasKey('directus_files', $privileges);
        $this->assertArrayNotHasKey('directus_users', $privileges);
    }

    /**
     * @expectedException \Directus\Permissions\Exception\UnauthorizedFieldReadException
     */
    public function testEnforceReadBlacklist()
    {
        $acl = $this->acl;

        $acl->enforceBlacklist('directus_files', ['name', 'type', 'date_uploaded'], $acl::FIELD_READ_BLACKLIST);
    }

    /**
     * @expectedException \Directus\Permissions\Exception\UnauthorizedFieldReadException
     */
    public function testEnforceReadBlacklist2()
    {
        $acl = $this->acl;

        $acl->enforceBlacklist('directus_files', ['*'], $acl::FIELD_READ_BLACKLIST);
    }

    /**
     * @expectedException \Directus\Permissions\Exception\UnauthorizedFieldWriteException
     */
    public function testEnforceWriteBlacklist()
    {
        $acl = $this->acl;

        $acl->enforceBlacklist('directus_files', ['name', 'type', 'date_uploaded'], $acl::FIELD_WRITE_BLACKLIST);
    }

    public function testEnforceBlacklist()
    {
        // Nothing happens here
        $acl = $this->acl;

        $acl->enforceBlacklist('directus_files', ['name', 'title', 'size'], $acl::FIELD_READ_BLACKLIST);
    }

    public function testUser()
    {
        $acl = new Acl();

        $this->assertNull($acl->getUserId());
        $this->assertNull($acl->getGroupId());

        $acl->setUserId(2);
        $acl->setGroupId(1);
        $this->assertSame(2, $acl->getUserId());
        $this->assertSame(1, $acl->getGroupId());

        $this->assertInternalType('string', $acl->getErrorMessagePrefix());
    }

    public function testTable()
    {
        $acl = $this->acl;

        $mandatoryFields = $acl->getTableMandatoryReadList('directus_files');
        $expectedFields = ['id', STATUS_COLUMN_NAME, 'user'];
        $this->assertEquals($expectedFields, $mandatoryFields);

        $this->assertTrue($acl->isTableListValue($acl::FIELD_READ_BLACKLIST));
        $this->assertTrue($acl->isTableListValue($acl::FIELD_WRITE_BLACKLIST));
    }

    /**
     * @expectedException \InvalidArgumentException
     */
    public function testGetPrivilegeListException()
    {
        $this->acl->getTablePrivilegeList('directus_users', 'a_non_existing_field');
    }

    /**
     * @expectedException RuntimeException
     */
    public function testGetPrivilegeListException2()
    {
        $acl = $this->acl;

        // when read/write permission value null
        $privileges = $this->acl->getTablePrivilegeList('test_table', $acl::FIELD_READ_BLACKLIST);
    }

    /**
     * @expectedException RuntimeException
     */
    public function testGetPrivilegeListException3()
    {
        $acl = $this->acl;

        // table does not exists in the group privileges
        $privileges = $this->acl->getTablePrivilegeList('directus_users', $acl::FIELD_WRITE_BLACKLIST);
    }

    public function testGetPrivilegeList()
    {
        $acl = $this->acl;

        // table does not exists in the group privileges
        $privileges = $this->acl->getTablePrivilegeList('directus_users', $acl::FIELD_READ_BLACKLIST);
        $this->assertInternalType('array', $privileges);
    }

    public function testGetPrivilegeListPermissions()
    {
        $privileges = $this->acl->getTablePrivilegeList('directus_files', 'permissions');
        $this->assertInternalType('array', $privileges);

        // table that does not exists in the privilege list
        $privileges = $this->acl->getTablePrivilegeList('directus_users', 'permissions');
        $this->assertInternalType('array', $privileges);
    }

    public function testHasPrivileges()
    {
        $this->assertTrue($this->acl->hasTablePrivilege('directus_files', 'bigedit'));
        $this->assertFalse($this->acl->hasTablePrivilege('test_table', 'bigedit'));
        $this->assertFalse($this->acl->hasTablePrivilege('test_table', 'delete'));
    }

    public function testHasPrivilegesHelper()
    {
        $this->assertFalse($this->acl->canAdd('forbid'));
        $this->assertTrue($this->acl->canAdd('directus_files'));

        $this->assertFalse($this->acl->canView('forbid'));
        $this->assertTrue($this->acl->canView('directus_files'));

        $this->assertFalse($this->acl->canAlter('forbid'));
        $this->assertTrue($this->acl->canAlter('directus_files'));
    }

    public function testEnforceCanAlterPassed()
    {
        $this->acl->enforceAlter('directus_files');
    }

    public function testEnforceCanAddPassed()
    {
        $this->acl->enforceAdd('directus_files');
    }

    /**
     * @expectedException \Directus\Permissions\Exception\UnauthorizedTableAlterException
     */
    public function testEnforceCanAlter()
    {
        $this->acl->enforceAlter('forbid');
    }

    /**
     * @expectedException \Directus\Permissions\Exception\UnauthorizedTableAddException
     */
    public function testEnforceCanAdd()
    {
        $this->acl->enforceAdd('forbid');
    }

    public function testCensorFields()
    {
        $expected = ['id' => 1, 'name' => 'file'];
        $readFields = array_merge($expected, ['date_uploaded' => 'today']);
        $this->assertEquals($expected, $this->acl->censorFields('directus_files', $readFields));
    }

    public function testOwnerColumn()
    {
        $this->assertSame('user', $this->acl->getCmsOwnerColumnByTable('directus_files'));
        $this->assertSame('id', $this->acl->getCmsOwnerColumnByTable('directus_users'));
        $this->assertSame(false, $this->acl->getCmsOwnerColumnByTable('test_table'));
        $this->assertSame(false, $this->acl->getCmsOwnerColumnByTable('no_a_table'));
    }

    /**
     * @expectedException \InvalidArgumentException
     */
    public function testGetOwnerIdException()
    {
        $this->acl->getRecordCmsOwnerId(1, 'directus_files');
    }

    public function testGetOwnerId()
    {
        $record = [
            'id' => 1,
            'name' => 'file',
            'user' => 3
        ];
        $this->assertSame(3, $this->acl->getRecordCmsOwnerId($record, 'directus_files'));
        $this->assertSame(false, $this->acl->getRecordCmsOwnerId($record, 'test_table'));
        $this->assertSame(false, $this->acl->getRecordCmsOwnerId(['id' => 1, 'name' => 'file'], 'directus_files'));

        $row = new \Zend\Db\RowGateway\RowGateway('id', 'directus_files', $this->getMockAdapter());
        $row->populate($record, false);
        $this->assertSame(3, $this->acl->getRecordCmsOwnerId($row, 'directus_files'));

        $row->populate(['id' => 1, 'name' => 'file'], false);
        $this->assertSame(false, $this->acl->getRecordCmsOwnerId($row, 'directus_files'));
    }

    protected function getMockAdapter()
    {
        // mock the adapter, driver, and parts
        $mockResult = $this->getMock('Zend\Db\Adapter\Driver\ResultInterface');
        $mockStatement = $this->getMock('Zend\Db\Adapter\Driver\StatementInterface');
        $mockStatement->expects($this->any())->method('execute')->will($this->returnValue($mockResult));
        $mockConnection = $this->getMock('Zend\Db\Adapter\Driver\ConnectionInterface');
        $mockDriver = $this->getMock('Zend\Db\Adapter\Driver\DriverInterface');
        $mockDriver->expects($this->any())->method('createStatement')->will($this->returnValue($mockStatement));
        $mockDriver->expects($this->any())->method('getConnection')->will($this->returnValue($mockConnection));

        // setup mock adapter
        return $this->getMock('Zend\Db\Adapter\Adapter', null, [$mockDriver]);
    }
}
