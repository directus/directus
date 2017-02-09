<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\Oci8\Feature;

use PHPUnit_Framework_TestCase;
use Zend\Db\Adapter\Driver\Oci8\Feature\RowCounter;

class RowCounterTest extends PHPUnit_Framework_TestCase
{
    /**
     * @var RowCounter
     */
    protected $rowCounter;

    public function setUp()
    {
        $this->rowCounter = new RowCounter();
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Oci8\Feature\RowCounter::getName
     */
    public function testGetName()
    {
        $this->assertEquals('RowCounter', $this->rowCounter->getName());
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Oci8\Feature\RowCounter::getCountForStatement
     */
    public function testGetCountForStatement()
    {
        $statement = $this->getMockStatement('SELECT XXX', 5);
        $statement->expects($this->once())
            ->method('prepare')
            ->with($this->equalTo('SELECT COUNT(*) as "count" FROM (SELECT XXX)'));
        $count = $this->rowCounter->getCountForStatement($statement);
        $this->assertEquals(5, $count);
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Oci8\Feature\RowCounter::getCountForSql
     */
    public function testGetCountForSql()
    {
        $this->rowCounter->setDriver($this->getMockDriver(5));
        $count = $this->rowCounter->getCountForSql('SELECT XXX');
        $this->assertEquals(5, $count);
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Oci8\Feature\RowCounter::getRowCountClosure
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
        $statement = $this->getMock(
            'Zend\Db\Adapter\Driver\Oci8\Statement',
            ['prepare', 'execute'],
            [],
            '',
            false
        );

        // mock the result
        $result = $this->getMock('stdClass', ['current']);
        $result->expects($this->once())
            ->method('current')
            ->will($this->returnValue(['count' => $returnValue]));
        $statement->setSql($sql);
        $statement->expects($this->once())
            ->method('execute')
            ->will($this->returnValue($result));
        return $statement;
    }

    protected function getMockDriver($returnValue)
    {
        $oci8Statement = $this->getMock('stdClass', ['current'], [], '', false); // stdClass can be used here
        $oci8Statement->expects($this->once())
            ->method('current')
            ->will($this->returnValue(['count' => $returnValue]));
        $connection = $this->getMock('Zend\Db\Adapter\Driver\ConnectionInterface');
        $connection->expects($this->once())
            ->method('execute')
            ->will($this->returnValue($oci8Statement));
        $driver = $this->getMock('Zend\Db\Adapter\Driver\Oci8\Oci8', ['getConnection'], [], '', false);
        $driver->expects($this->once())
            ->method('getConnection')
            ->will($this->returnValue($connection));
        return $driver;
    }
}
