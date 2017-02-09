<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\RowGateway;

use PHPUnit_Framework_TestCase;
use Zend\Db\RowGateway\RowGateway;

class RowGatewayTest extends PHPUnit_Framework_TestCase
{
    protected $mockAdapter;
    protected $rowGateway;

    public function setup()
    {
        // mock the adapter, driver, and parts
        $mockResult = $this->getMock('Zend\Db\Adapter\Driver\ResultInterface');
        $mockResult->expects($this->any())->method('getAffectedRows')->will($this->returnValue(1));
        $this->mockResult = $mockResult;

        $mockStatement = $this->getMock('Zend\Db\Adapter\Driver\StatementInterface');
        $mockStatement->expects($this->any())->method('execute')->will($this->returnValue($mockResult));

        $mockConnection = $this->getMock('Zend\Db\Adapter\Driver\ConnectionInterface');

        $mockDriver = $this->getMock('Zend\Db\Adapter\Driver\DriverInterface');
        $mockDriver->expects($this->any())->method('createStatement')->will($this->returnValue($mockStatement));
        $mockDriver->expects($this->any())->method('getConnection')->will($this->returnValue($mockConnection));

        // setup mock adapter
        $this->mockAdapter = $this->getMock('Zend\Db\Adapter\Adapter', null, [$mockDriver]);
    }

    public function testEmptyPrimaryKey()
    {
        $this->setExpectedException('Zend\Db\RowGateway\Exception\RuntimeException', 'This row object does not have a primary key column set.');
        $this->rowGateway = new RowGateway('', 'foo', $this->mockAdapter);
    }
}
