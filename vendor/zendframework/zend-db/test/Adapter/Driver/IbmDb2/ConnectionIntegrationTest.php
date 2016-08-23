<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\IbmDb2;

use Zend\Db\Adapter\Driver\IbmDb2\IbmDb2;
use Zend\Db\Adapter\Driver\IbmDb2\Connection;

/**
 * @group integration
 * @group integration-ibm_db2
 */
class ConnectionIntegrationTest extends AbstractIntegrationTest
{
    /**
     * @covers Zend\Db\Adapter\Driver\IbmDb2\Connection::getCurrentSchema
     */
    public function testGetCurrentSchema()
    {
        $connection = new Connection($this->variables);
        $this->assertInternalType('string', $connection->getCurrentSchema());
    }

    /**
     * @covers Zend\Db\Adapter\Driver\IbmDb2\Connection::setResource
     */
    public function testSetResource()
    {
        $resource = db2_connect(
            $this->variables['database'],
            $this->variables['username'],
            $this->variables['password']
        );
        $connection = new Connection(array());
        $this->assertSame($connection, $connection->setResource($resource));

        $connection->disconnect();
        unset($connection);
        unset($resource);
    }

    /**
     * @covers Zend\Db\Adapter\Driver\IbmDb2\Connection::getResource
     */
    public function testGetResource()
    {
        $connection = new Connection($this->variables);
        $connection->connect();
        $this->assertInternalType('resource', $connection->getResource());

        $connection->disconnect();
        unset($connection);
    }

    /**
     * @covers Zend\Db\Adapter\Driver\IbmDb2\Connection::connect
     */
    public function testConnect()
    {
        $connection = new Connection($this->variables);
        $this->assertSame($connection, $connection->connect());
        $this->assertTrue($connection->isConnected());

        $connection->disconnect();
        unset($connection);
    }

    /**
     * @covers Zend\Db\Adapter\Driver\IbmDb2\Connection::isConnected
     */
    public function testIsConnected()
    {
        $connection = new Connection($this->variables);
        $this->assertFalse($connection->isConnected());
        $this->assertSame($connection, $connection->connect());
        $this->assertTrue($connection->isConnected());

        $connection->disconnect();
        unset($connection);
    }

    /**
     * @covers Zend\Db\Adapter\Driver\IbmDb2\Connection::disconnect
     */
    public function testDisconnect()
    {
        $connection = new Connection($this->variables);
        $connection->connect();
        $this->assertTrue($connection->isConnected());
        $connection->disconnect();
        $this->assertFalse($connection->isConnected());
    }

    /**
     * @covers Zend\Db\Adapter\Driver\IbmDb2\Connection::beginTransaction
     * @todo   Implement testBeginTransaction().
     */
    public function testBeginTransaction()
    {
        // Remove the following lines when you implement this test.
        $this->markTestIncomplete(
            'This test has not been implemented yet.'
        );
    }

    /**
     * @covers Zend\Db\Adapter\Driver\IbmDb2\Connection::commit
     * @todo   Implement testCommit().
     */
    public function testCommit()
    {
        // Remove the following lines when you implement this test.
        $this->markTestIncomplete(
            'This test has not been implemented yet.'
        );
    }

    /**
     * @covers Zend\Db\Adapter\Driver\IbmDb2\Connection::rollback
     * @todo   Implement testRollback().
     */
    public function testRollback()
    {
        // Remove the following lines when you implement this test.
        $this->markTestIncomplete(
            'This test has not been implemented yet.'
        );
    }

    /**
     * @covers Zend\Db\Adapter\Driver\IbmDb2\Connection::execute
     */
    public function testExecute()
    {
        $ibmdb2 = new IbmDb2($this->variables);
        $connection = $ibmdb2->getConnection();

        $result = $connection->execute('SELECT \'foo\' FROM SYSIBM.SYSDUMMY1');
        $this->assertInstanceOf('Zend\Db\Adapter\Driver\IbmDb2\Result', $result);
    }

    /**
     * @covers Zend\Db\Adapter\Driver\IbmDb2\Connection::getLastGeneratedValue
     */
    public function testGetLastGeneratedValue()
    {
        $this->markTestIncomplete('Need to create a temporary sequence.');
        $connection = new Connection($this->variables);
        $connection->getLastGeneratedValue();
    }

    /**
     * @group zf3469
     */
    public function testConnectReturnsConnectionWhenResourceSet()
    {
        $resource = db2_connect(
            $this->variables['database'],
            $this->variables['username'],
            $this->variables['password']
        );
        $connection = new Connection(array());
        $connection->setResource($resource);
        $this->assertSame($connection, $connection->connect());

        $connection->disconnect();
        unset($connection);
        unset($resource);
    }
}
