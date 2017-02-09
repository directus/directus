<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\Pdo\Feature;

use PHPUnit_Framework_TestCase;
use Zend\Db\Adapter\Driver\Pdo\Feature\SqliteRowCounter;

class SqliteRowCounterTest extends PHPUnit_Framework_TestCase
{
    /**
     * @var SqliteRowCounter
     */
    protected $rowCounter;

    public function setUp()
    {
        $this->rowCounter = new SqliteRowCounter();
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Pdo\Feature\SqliteRowCounter::getName
     */
    public function testGetName()
    {
        $this->assertEquals('SqliteRowCounter', $this->rowCounter->getName());
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Pdo\Feature\SqliteRowCounter::getCountForStatement
     */
    public function testGetCountForStatement()
    {
        $statement = $this->getMockStatement('SELECT XXX', 5);
        $statement->expects($this->once())->method('prepare')->with($this->equalTo('SELECT COUNT(*) as "count" FROM (SELECT XXX)'));

        $count = $this->rowCounter->getCountForStatement($statement);
        $this->assertEquals(5, $count);
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Pdo\Feature\SqliteRowCounter::getCountForSql
     */
    public function testGetCountForSql()
    {
        $this->rowCounter->setDriver($this->getMockDriver(5));
        $count = $this->rowCounter->getCountForSql('SELECT XXX');
        $this->assertEquals(5, $count);
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Pdo\Feature\SqliteRowCounter::getRowCountClosure
     */
    public function testGetRowCountClosure()
    {
        $stmt = $this->getMockStatement('SELECT XXX', 5);

        /** @var \Closure $closure */
        $closure = $this->rowCounter->getRowCountClosure($stmt);
        $this->assertInstanceOf('Closure', $closure);
        $this->assertEquals(5, $closure());
    }

    protected function getMockStatement($sql, $returnValue)
    {
        /** @var \Zend\Db\Adapter\Driver\Pdo\Statement|\PHPUnit_Framework_MockObject_MockObject $statement */
        $statement = $this->getMock('Zend\Db\Adapter\Driver\Pdo\Statement', ['prepare', 'execute'], [], '', false);

        // mock PDOStatement with stdClass
        $resource = $this->getMock('stdClass', ['fetch']);
        $resource->expects($this->once())
            ->method('fetch')
            ->will($this->returnValue(['count' => $returnValue]));

        // mock the result
        $result = $this->getMock('Zend\Db\Adapter\Driver\ResultInterface');
        $result->expects($this->once())
            ->method('getResource')
            ->will($this->returnValue($resource));

        $statement->setSql($sql);
        $statement->expects($this->once())
            ->method('execute')
            ->will($this->returnValue($result));

        return $statement;
    }

    protected function getMockDriver($returnValue)
    {
        $pdoStatement = $this->getMock('stdClass', ['fetch'], [], '', false); // stdClass can be used here
        $pdoStatement->expects($this->once())
            ->method('fetch')
            ->will($this->returnValue(['count' => $returnValue]));

        $pdoConnection = $this->getMock('stdClass', ['query']);
        $pdoConnection->expects($this->once())
            ->method('query')
            ->will($this->returnValue($pdoStatement));

        $connection = $this->getMock('Zend\Db\Adapter\Driver\ConnectionInterface');
        $connection->expects($this->once())
            ->method('getResource')
            ->will($this->returnValue($pdoConnection));

        $driver = $this->getMock('Zend\Db\Adapter\Driver\Pdo\Pdo', ['getConnection'], [], '', false);
        $driver->expects($this->once())
            ->method('getConnection')
            ->will($this->returnValue($connection));

        return $driver;
    }
}
