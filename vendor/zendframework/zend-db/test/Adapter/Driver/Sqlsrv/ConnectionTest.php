<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\Sqlsrv;

use Zend\Db\Adapter\Driver\Sqlsrv\Sqlsrv;
use Zend\Db\Adapter\Driver\Sqlsrv\Connection;

class ConnectionTest extends \PHPUnit_Framework_TestCase
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
        $this->connection = new Connection(array());
    }

    /**
     * Tears down the fixture, for example, closes a network connection.
     * This method is called after a test is executed.
     */
    protected function tearDown()
    {
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Sqlsrv\Connection::setDriver
     */
    public function testSetDriver()
    {
        $this->assertEquals($this->connection, $this->connection->setDriver(new Sqlsrv(array())));
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Sqlsrv\Connection::setConnectionParameters
     */
    public function testSetConnectionParameters()
    {
        $this->assertEquals($this->connection, $this->connection->setConnectionParameters(array()));
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Sqlsrv\Connection::getConnectionParameters
     */
    public function testGetConnectionParameters()
    {
        $this->connection->setConnectionParameters(array('foo' => 'bar'));
        $this->assertEquals(array('foo' => 'bar'), $this->connection->getConnectionParameters());
    }

}
