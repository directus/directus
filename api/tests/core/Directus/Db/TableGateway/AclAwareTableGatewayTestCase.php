<?php

namespace ApiTestSuite\Directus\Db\TableGateway;

use Directus\Bootstrap;
use Directus\Auth\Provider as AuthProvider;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Directus\Db\TableGateway\DirectusActivityTableGateway;
use Directus\Db\TableGateway\DirectusUsersTableGateway;
use Directus\Db\TableGateway\DirectusPrivilegesTableGateway;
use Zend\Db\Sql\Expression;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Where;

class AclAwareTableGatewayTestCase extends \DirectusApiTestCase {

	protected function setUp() {
		parent::setUp();
        $this->ActivityTableGateway = new DirectusActivityTableGateway($this->acl, $this->ZendDb);
        $this->PrivilegesGateway = new DirectusPrivilegesTableGateway($this->acl, $this->ZendDb);
        $this->UsersGateway = new DirectusUsersTableGateway($this->acl, $this->ZendDb);
        // Pending data fixtures
        $_SESSION[AuthProvider::$SESSION_KEY] = array('id' => 7);
		$this->currentUser = array('id' => 7, 'group' => 0);
		$this->baseUserGroupPrivileges = $this->PrivilegesGateway->fetchGroupPrivileges($this->currentUser['group']);
	}

    /**
     * @expectedException Directus\Acl\Exception\UnauthorizedFieldWriteException
     */
    public function testUpdateWriteBlacklistEnforcement() {
        // Omit "big" privileges
        $groupPrivileges = $this->baseUserGroupPrivileges;
        $groupPrivileges['directus_users']['write_field_blacklist'] = array('salt');
        $groupPrivileges['directus_users']['permissions'] = array('add','edit','delete');
        $this->acl->setGroupPrivileges($groupPrivileges);

        // This should throw an AclException
        $set = array('salt' => 'jibbajabba');
        $where = array('id' => $this->currentUser['id']);
        $this->UsersGateway->update($set, $where);
    }

    /**
     * @expectedException Directus\Acl\Exception\UnauthorizedFieldWriteException
     */
    public function testInsertWriteBlacklistEnforcement() {
        // Omit "big" privileges
        $groupPrivileges = $this->baseUserGroupPrivileges;
        $groupPrivileges['directus_activity']['write_field_blacklist'] = array('data');
        $groupPrivileges['directus_activity']['permissions'] = array('add','edit','delete');
        $this->acl->setGroupPrivileges($groupPrivileges);

        // This should throw an AclException
        $this->ActivityTableGateway->insert(array(
            'add'           => null,
            'type'          => 'ENTRY',
            'action'        => 'UPDATE',
            'identifier'    => 'Gerry',
            'table_name'    => 'directus_users',
            'row_id'        => 4,
            'user'          => 3,
            'data'          => '{1:3,2:4}',
            'parent_id'     => null,
            'datetime'      => new Expression('NOW()')
        ), array('1' => '1'));
    }

    /**
     * @expectedException Directus\Acl\Exception\UnauthorizedTableAddException
     */
    public function testInsertAddEnforcement() {
        // Omit "add" privileges from the test table & set arbitrary write blacklist
        $groupPrivileges = $this->baseUserGroupPrivileges;
        $groupPrivileges['directus_activity']['write_field_blacklist'] = array('data');
        $groupPrivileges['directus_activity']['permissions'] = array('edit','delete');
        $this->acl->setGroupPrivileges($groupPrivileges);

        // This should throw an AclException
        $this->ActivityTableGateway->insert(array(
            'add'           => null,
            'type'          => 'ENTRY',
            'action'        => 'UPDATE',
            'identifier'    => 'Gerry',
            'table_name'    => 'directus_users',
            'row_id'        => 4,
            'user'          => 3,
            'data'          => '{1:3,2:4}',
            'parent_id'     => null,
            'datetime'      => new Expression('NOW()')
        ), array('1' => '1'));
    }

    /**
     * @expectedException Directus\Acl\Exception\UnauthorizedTableBigEditException
     */
    public function testUpdateBigEditEnforcementWithMagicOwnerColumn() {
        // Omit "bigedit" privileges from the test table
        $groupPrivileges = $this->baseUserGroupPrivileges;
        $groupPrivileges['directus_media']['permissions'] = array('edit','delete');
        $this->acl->setGroupPrivileges($groupPrivileges);

        // Find a record which isn't ours on the media table
        $mediaCmsOwnerColumn = $this->acl->getCmsOwnerColumnByTable("directus_media");
        $MediaGateway = new AclAwareTableGateway($this->acl, "directus_media", $this->ZendDb);
        $select = new Select("directus_media");
        $select->where->notEqualTo($mediaCmsOwnerColumn, $this->currentUser['id']);
        $select->limit(1);
        $results = $MediaGateway->selectWith($select);
        if(0 === count($results))
            throw new \Exception("This test requires a `directus_media` record whose CMS owner (column `$mediaCmsOwnerColumn`) is not the current user (with id " . $this->currentUser['id'] . ")");

        $mediaEntry = $results->current();

        // This should throw an AclException
        $set = array('Caption' => 'Transgressive update attempt.');
        $where = array('id' => $mediaEntry['id']);
        $MediaGateway->update($set, $where);
    }

    /**
     * @expectedException Directus\Acl\Exception\UnauthorizedTableBigEditException
     */
    public function testUpdateBigEditEnforcementWithMagicOwnerColumnAndMultipleOwners() {
        // Omit "bigedit" privileges from the test table
        $groupPrivileges = $this->baseUserGroupPrivileges;
        $groupPrivileges['directus_media']['permissions'] = array('edit','delete');
        $this->acl->setGroupPrivileges($groupPrivileges);

        // Find a record which isn't ours on the media table
        $mediaCmsOwnerColumn = $this->acl->getCmsOwnerColumnByTable("directus_media");
        $MediaGateway = new AclAwareTableGateway($this->acl, "directus_media", $this->ZendDb);
        $select = new Select("directus_media");
        $select->group($mediaCmsOwnerColumn);
        $select->where->notEqualTo($mediaCmsOwnerColumn, $this->currentUser['id']);
        $results = $MediaGateway->selectWith($select);
        if(count($results) < 2)
            throw new \Exception("This test requires at least 2 `directus_media` records whose CMS owner (column `$mediaCmsOwnerColumn`) is not the current user (with id " . $this->currentUser['id'] . ")");

        $recordIds = array();
        foreach($results as $row)
            $recordIds[] = $row['id'];

        // This should throw an AclException
        $set = array('Caption' => 'Transgressive update attempt.');
        $where = new Where;
        $where->in('id', $recordIds);
        $MediaGateway->update($set, $where);
    }

    /**
     * @expectedException Directus\Acl\Exception\UnauthorizedTableBigEditException
     */
    public function testUpdateBigEditEnforcementWithoutMagicOwnerColumn() {
        // Omit "bigedit" privileges from the test table
        $groupPrivileges = $this->baseUserGroupPrivileges;
        $groupPrivileges['directus_tables']['permissions'] = array('edit','delete');
        $this->acl->setGroupPrivileges($groupPrivileges);

        // This should throw an AclException
        $DirectusTablesGateway = new AclAwareTableGateway($this->acl, 'directus_tables', $this->ZendDb);
        $set = array('hidden' => '1');
        $where = array('1' => '1');
        $DirectusTablesGateway->update($set, $where);
    }

    /**
     * @expectedException Directus\Acl\Exception\UnauthorizedTableBigDeleteException
     */
    public function testBigDeleteEnforcementWithoutMagicOwnerColumn() {
        // Omit "bigdelete" privileges from the test table
        $groupPrivileges = $this->baseUserGroupPrivileges;
        $groupPrivileges['directus_tables']['permissions'] = array('edit');
        $this->acl->setGroupPrivileges($groupPrivileges);

        // This should throw an AclException
        $DirectusTablesGateway = new AclAwareTableGateway($this->acl, 'directus_tables', $this->ZendDb);
        $where = array('1' => '1');
        $DirectusTablesGateway->delete($where);
    }

    /**
     * @expectedException Directus\Acl\Exception\UnauthorizedTableBigDeleteException
     */
    public function testBigDeleteEnforcementWithMagicOwnerColumnAndMultipleOwners() {
        // Omit "bigdelete" privileges from the test table
        $groupPrivileges = $this->baseUserGroupPrivileges;
        $groupPrivileges['directus_media']['permissions'] = array('edit','delete');
        $this->acl->setGroupPrivileges($groupPrivileges);

        // Find a record which isn't ours on the media table
        $mediaCmsOwnerColumn = $this->acl->getCmsOwnerColumnByTable("directus_media");
        $MediaGateway = new AclAwareTableGateway($this->acl, "directus_media", $this->ZendDb);
        $select = new Select("directus_media");
        $select->group($mediaCmsOwnerColumn);
        $select->where->notEqualTo($mediaCmsOwnerColumn, $this->currentUser['id']);
        $results = $MediaGateway->selectWith($select);
        if(count($results) < 2)
            throw new \Exception("This test requires at least 2 `directus_media` records whose CMS owner (column `$mediaCmsOwnerColumn`) is not the current user (with id " . $this->currentUser['id'] . ")");

        $recordIds = array();
        foreach($results as $row)
            $recordIds[] = $row['id'];

        // This should throw an AclException
        $where = new Where;
        $where->in('id', $recordIds);
        $MediaGateway->delete($where);
    }

    /**
     * @expectedException Directus\Acl\Exception\UnauthorizedTableDeleteException
     */
    public function testLittleDeleteEnforcement() {
        // Omit "little" delete privilege from the test table
        $groupPrivileges = $this->baseUserGroupPrivileges;
        $groupPrivileges['directus_users']['permissions'] = array('edit');
        $this->acl->setGroupPrivileges($groupPrivileges);

        // This should throw an AclException
        $usersCmsOwnerColumn = $this->acl->getCmsOwnerColumnByTable("directus_users");
        $where = new Where;
        $where->equalTo($usersCmsOwnerColumn, $this->currentUser[$usersCmsOwnerColumn]);
        $this->UsersGateway->delete($where);
    }

    /**
     * @expectedException Directus\Acl\Exception\UnauthorizedTableEditException
     */
    public function testLittleEditEnforcement() {
        // Omit "little" edit privilege from the test table
        $groupPrivileges = $this->baseUserGroupPrivileges;
        $groupPrivileges['directus_users']['permissions'] = array('delete');
        $this->acl->setGroupPrivileges($groupPrivileges);

        // This should throw an AclException
        $usersCmsOwnerColumn = $this->acl->getCmsOwnerColumnByTable("directus_users");
        $set = array('first_name' => 'Transgressive');
        $where = new Where;
        $where->equalTo($usersCmsOwnerColumn, $this->currentUser[$usersCmsOwnerColumn]);
        $this->UsersGateway->update($set, $where);
    }

    /**
     * @expectedException Directus\Acl\Exception\UnauthorizedFieldReadException
     */
    public function testSelectAllFieldReadBlacklistEnforcement() {
        // Include a number of fields on the read field blacklist
        $groupPrivileges = $this->baseUserGroupPrivileges;
        $blacklistedColumns = array('password','salt');
        $groupPrivileges['directus_users']['read_field_blacklist'] = $blacklistedColumns;
        $this->acl->setGroupPrivileges($groupPrivileges);

        // This should throw an AclException
        $select = new Select('directus_users');
        $this->UsersGateway->selectWith($select);
    }

    /**
     * @expectedException Directus\Acl\Exception\UnauthorizedFieldReadException
     */
    public function testSelectAllFieldReadBlacklistEnforcementWithTableNameAlias() {
        // Include a number of fields on the read field blacklist
        $groupPrivileges = $this->baseUserGroupPrivileges;
        $blacklistedColumns = array('non','empty');
        $groupPrivileges['some_table']['read_field_blacklist'] = $blacklistedColumns;
        $this->acl->setGroupPrivileges($groupPrivileges);

        // This should throw an AclException
        $SomeTableGateway = new AclAwareTableGateway($this->acl, 'some_table', $this->ZendDb);
        $select = new Select(array('some_alias' => 'some_table'));
        $SomeTableGateway->selectWith($select);
    }

    /**
     * @expectedException Directus\Acl\Exception\UnauthorizedFieldReadException
     */
    public function testSelectSomeFieldReadBlacklistEnforcement() {
        $table_name = 'a_table_with_some_sensitive_info';

        // Include a number of fields on the read field blacklist
        $groupPrivileges = $this->baseUserGroupPrivileges;
        $blacklistedColumns = array('ssn','dreams');
        $groupPrivileges[$table_name] = array();
        $groupPrivileges[$table_name]['read_field_blacklist'] = $blacklistedColumns;
        $this->acl->setGroupPrivileges($groupPrivileges);

        // This should throw an AclException
        $SensitiveTableGateway = new AclAwareTableGateway($this->acl, $table_name, $this->ZendDb);
        $select = new Select($table_name);
        $columns = array('id','active','public_info_1','public_info_2');
        $columns = array_merge($columns, $blacklistedColumns);
        $select->columns($columns);
        $SensitiveTableGateway->selectWith($select);
    }

    /**
     * @expectedException Directus\Acl\Exception\UnauthorizedFieldReadException
     */
    public function testJoinAllFieldReadBlacklistEnforcement() {
        $table_a = "main_table";
        $table_b = "join_table";

        // Include a number of fields on the read field blacklist
        $blacklistedColumns = array('ssn','dreams');
        $groupPrivileges = $this->baseUserGroupPrivileges;
        $groupPrivileges[$table_b] = array();
        $groupPrivileges[$table_b]['read_field_blacklist'] = $blacklistedColumns;
        $this->acl->setGroupPrivileges($groupPrivileges);

        // This should throw an AclException
        $ATableGateway = new AclAwareTableGateway($this->acl, $table_a, $this->ZendDb);
        $select = new Select($table_a);
        $select->join($table_b, "$table_a.id = $table_b.foreign_id");
        $ATableGateway->selectWith($select);
    }

    /**
     * @expectedException Directus\Acl\Exception\UnauthorizedFieldReadException
     */
    public function testJoinAllFieldReadBlacklistEnforcementWithTableNameAlias() {
        $table_a = "main_table";
        $table_b = "join_table";

        // Include a number of fields on the read field blacklist
        $blacklistedColumns = array('ssn','dreams');
        $groupPrivileges = $this->baseUserGroupPrivileges;
        $groupPrivileges[$table_b] = array();
        $groupPrivileges[$table_b]['read_field_blacklist'] = $blacklistedColumns;
        $this->acl->setGroupPrivileges($groupPrivileges);

        // This should throw an AclException
        $ATableGateway = new AclAwareTableGateway($this->acl, $table_a, $this->ZendDb);
        $select = new Select($table_a);
        $select->join(array('b' => $table_b), "$table_a.id = $table_b.foreign_id");
        $ATableGateway->selectWith($select);
    }

    /**
     * @expectedException Directus\Acl\Exception\UnauthorizedFieldReadException
     */
    public function testJoinSomeFieldReadBlacklistEnforcement() {
        $table_a = "main_table";
        $table_b = "join_table";

        // Include a number of fields on the read field blacklist
        $blacklistedColumns = array('ssn','dreams');
        $groupPrivileges = $this->baseUserGroupPrivileges;
        $groupPrivileges[$table_b] = array();
        $groupPrivileges[$table_b]['read_field_blacklist'] = $blacklistedColumns;
        $this->acl->setGroupPrivileges($groupPrivileges);

        // This should throw an AclException
        $MainTableGateway = new AclAwareTableGateway($this->acl, $table_a, $this->ZendDb);
        $columns = array('id','active','public_info_1','public_info_2');
        $columns = array_merge($columns, $blacklistedColumns);
        $select = new Select($table_a);
        $select->join($table_b, "$table_a.id = $table_b.foreign_id", $columns);
        $MainTableGateway->selectWith($select);
    }

}
