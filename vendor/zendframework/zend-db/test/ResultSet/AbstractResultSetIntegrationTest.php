<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\ResultSet;

use PHPUnit\Framework\TestCase;

class AbstractResultSetIntegrationTest extends TestCase
{
    /**
     * @var \Zend\Db\ResultSet\AbstractResultSet|\PHPUnit_Framework_MockObject_MockObject
     */
    protected $resultSet;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        $this->resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
    }

    /**
     * @covers \Zend\Db\ResultSet\AbstractResultSet::current
     */
    public function testCurrentCallsDataSourceCurrentAsManyTimesWithoutBuffer()
    {
        $result = $this->getMockBuilder('Zend\Db\Adapter\Driver\ResultInterface')->getMock();
        $this->resultSet->initialize($result);
        $result->expects($this->exactly(3))->method('current')->will($this->returnValue(['foo' => 'bar']));
        $value1 = $this->resultSet->current();
        $value2 = $this->resultSet->current();
        $this->resultSet->current();
        self::assertEquals($value1, $value2);
    }

    /**
     * @covers \Zend\Db\ResultSet\AbstractResultSet::current
     */
    public function testCurrentCallsDataSourceCurrentOnceWithBuffer()
    {
        $result = $this->getMockBuilder('Zend\Db\Adapter\Driver\ResultInterface')->getMock();
        $this->resultSet->buffer();
        $this->resultSet->initialize($result);
        $result->expects($this->once())->method('current')->will($this->returnValue(['foo' => 'bar']));
        $value1 = $this->resultSet->current();
        $value2 = $this->resultSet->current();
        $this->resultSet->current();
        self::assertEquals($value1, $value2);
    }
}
