<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\RowGateway;

use PHPUnit\Framework\TestCase;
use Zend\Db\RowGateway\RowGateway;

class RowGatewayTest extends TestCase
{
    protected $mockAdapter;
    protected $rowGateway;

    protected function setUp()
    {
        // mock the adapter, driver, and parts
        $mockResult = $this->getMockBuilder('Zend\Db\Adapter\Driver\ResultInterface')->getMock();
        $mockResult->expects($this->any())->method('getAffectedRows')->will($this->returnValue(1));
        $this->mockResult = $mockResult;

        $mockStatement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')->getMock();
        $mockStatement->expects($this->any())->method('execute')->will($this->returnValue($mockResult));

        $mockConnection = $this->getMockBuilder('Zend\Db\Adapter\Driver\ConnectionInterface')->getMock();

        $mockDriver = $this->getMockBuilder('Zend\Db\Adapter\Driver\DriverInterface')->getMock();
        $mockDriver->expects($this->any())->method('createStatement')->will($this->returnValue($mockStatement));
        $mockDriver->expects($this->any())->method('getConnection')->will($this->returnValue($mockConnection));

        // setup mock adapter
        $this->mockAdapter = $this->getMockBuilder('Zend\Db\Adapter\Adapter')
            ->setMethods()
            ->setConstructorArgs([$mockDriver])
            ->getMock();
    }

    public function testEmptyPrimaryKey()
    {
        $this->expectException('Zend\Db\RowGateway\Exception\RuntimeException');
        $this->expectExceptionMessage('This row object does not have a primary key column set.');
        $this->rowGateway = new RowGateway('', 'foo', $this->mockAdapter);
    }
}
