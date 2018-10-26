<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\Mysqli;

use PHPUnit\Framework\TestCase;
use Zend\Db\Adapter\Driver\Mysqli\Connection;
use Zend\Db\Adapter\Driver\Mysqli\Mysqli;

class ConnectionTest extends TestCase
{
    /**
     * @var Connection
     */
    protected $connection;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        if (! getenv('TESTS_ZEND_DB_ADAPTER_DRIVER_MYSQL')) {
            $this->markTestSkipped('Mysqli test disabled');
        }
        $this->connection = new Connection([]);
    }

    /**
     * Tears down the fixture, for example, closes a network connection.
     * This method is called after a test is executed.
     */
    protected function tearDown()
    {
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Mysqli\Connection::setDriver
     */
    public function testSetDriver()
    {
        self::assertEquals($this->connection, $this->connection->setDriver(new Mysqli([])));
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Mysqli\Connection::setConnectionParameters
     */
    public function testSetConnectionParameters()
    {
        self::assertEquals($this->connection, $this->connection->setConnectionParameters([]));
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Mysqli\Connection::getConnectionParameters
     */
    public function testGetConnectionParameters()
    {
        $this->connection->setConnectionParameters(['foo' => 'bar']);
        self::assertEquals(['foo' => 'bar'], $this->connection->getConnectionParameters());
    }

    public function testConnectionFails()
    {
        $connection = new Connection([]);

        $this->expectException('\Zend\Db\Adapter\Exception\RuntimeException');
        $this->expectExceptionMessage('Connection error');
        $connection->connect();
    }
}
