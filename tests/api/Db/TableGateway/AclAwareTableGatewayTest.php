<?php

class AclAwareTableGatewayTest extends PHPUnit_Framework_TestCase
{
    public function testConstructor()
    {
//        $aclMock = $this->getAclMock();
//        $adapterMock = get_adapter_mock();
//        $table = new AclAwareTableGateway($aclMock, 'directus_users', $adapterMock);
        $table = $this->getMockBuilder('\Directus\Database\TableGateway\AclAwareTableGateway')
                ->disableOriginalConstructor()
                ->getMock();

        $adapter = get_mock_adapter($this);
        $acl = new Directus\Acl\Acl();
        //$table = new \Directus\Database\TableGateway\AclAwareTableGateway($acl, 'users', $adapter);
    }

    protected function getAclMock()
    {
        $mock = $this->getMockBuilder('\Directus\Acl\Acl')
            ->setConstructorArgs([])
            ->getMock();

        return $mock;
    }
}
