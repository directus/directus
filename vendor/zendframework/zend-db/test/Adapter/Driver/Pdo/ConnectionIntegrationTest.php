<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\Pdo;

use Zend\Db\Adapter\Driver\Pdo\Pdo;
use Zend\Db\Adapter\Driver\Pdo\Connection;

/**
 * @group integration
 * @group integration-pdo
 */
class ConnectionIntegrationTest extends \PHPUnit_Framework_TestCase
{
    protected $variables = ['pdodriver' => 'sqlite', 'database' => ':memory:'];

    /**
     * @covers Zend\Db\Adapter\Driver\Pdo\Connection::getCurrentSchema
     */
    public function testGetCurrentSchema()
    {
        $connection = new Connection($this->variables);
        $this->assertInternalType('string', $connection->getCurrentSchema());
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Pdo\Connection::setResource
     */
    public function testSetResource()
    {
        $resource = new TestAsset\SqliteMemoryPdo();
        $connection = new Connection([]);
        $this->assertSame($connection, $connection->setResource($resource));

        $connection->disconnect();
        unset($connection);
        unset($resource);
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Pdo\Connection::getResource
     */
    public function testGetResource()
    {
        $connection = new Connection($this->variables);
        $connection->connect();
        $this->assertInstanceOf('PDO', $connection->getResource());

        $connection->disconnect();
        unset($connection);
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Pdo\Connection::connect
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
     * @covers Zend\Db\Adapter\Driver\Pdo\Connection::isConnected
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
     * @covers Zend\Db\Adapter\Driver\Pdo\Connection::disconnect
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
     * @covers Zend\Db\Adapter\Driver\Pdo\Connection::beginTransaction
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
     * @covers Zend\Db\Adapter\Driver\Pdo\Connection::commit
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
     * @covers Zend\Db\Adapter\Driver\Pdo\Connection::rollback
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
     * @covers Zend\Db\Adapter\Driver\Pdo\Connection::execute
     */
    public function testExecute()
    {
        $sqlsrv = new Pdo($this->variables);
        $connection = $sqlsrv->getConnection();

        $result = $connection->execute('SELECT \'foo\'');
        $this->assertInstanceOf('Zend\Db\Adapter\Driver\Pdo\Result', $result);
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Pdo\Connection::prepare
     */
    public function testPrepare()
    {
        $sqlsrv = new Pdo($this->variables);
        $connection = $sqlsrv->getConnection();

        $statement = $connection->prepare('SELECT \'foo\'');
        $this->assertInstanceOf('Zend\Db\Adapter\Driver\Pdo\Statement', $statement);
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Pdo\Connection::getLastGeneratedValue
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
        $resource = new TestAsset\SqliteMemoryPdo();
        $connection = new Connection([]);
        $connection->setResource($resource);
        $this->assertSame($connection, $connection->connect());

        $connection->disconnect();
        unset($connection);
        unset($resource);
    }
}
