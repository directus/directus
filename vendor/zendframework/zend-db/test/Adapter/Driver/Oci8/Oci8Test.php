<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\Oci8;

use Zend\Db\Adapter\Driver\Oci8\Oci8;

class Oci8Test extends \PHPUnit_Framework_TestCase
{

    /**
     * @var Oci8
     */
    protected $oci8 = null;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        $this->oci8 = new Oci8(array());
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Oci8\Oci8::registerConnection
     */
    public function testRegisterConnection()
    {
        $mockConnection = $this->getMockForAbstractClass('Zend\Db\Adapter\Driver\Oci8\Connection', array(array()), '', true, true, true, array('setDriver'));
        $mockConnection->expects($this->once())->method('setDriver')->with($this->equalTo($this->oci8));
        $this->assertSame($this->oci8, $this->oci8->registerConnection($mockConnection));
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Oci8\Oci8::registerStatementPrototype
     */
    public function testRegisterStatementPrototype()
    {
        $this->oci8 = new Oci8(array());
        $mockStatement = $this->getMockForAbstractClass('Zend\Db\Adapter\Driver\Oci8\Statement', array(), '', true, true, true, array('setDriver'));
        $mockStatement->expects($this->once())->method('setDriver')->with($this->equalTo($this->oci8));
        $this->assertSame($this->oci8, $this->oci8->registerStatementPrototype($mockStatement));
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Oci8\Oci8::registerResultPrototype
     */
    public function testRegisterResultPrototype()
    {
        $this->oci8 = new Oci8(array());
        $mockStatement = $this->getMockForAbstractClass('Zend\Db\Adapter\Driver\Oci8\Result', array(), '', true, true, true, array('setDriver'));
        $this->assertSame($this->oci8, $this->oci8->registerResultPrototype($mockStatement));
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Oci8\Oci8::getDatabasePlatformName
     */
    public function testGetDatabasePlatformName()
    {
        $this->oci8 = new Oci8(array());
        $this->assertEquals('Oracle', $this->oci8->getDatabasePlatformName());
        $this->assertEquals('Oracle', $this->oci8->getDatabasePlatformName(Oci8::NAME_FORMAT_NATURAL));
    }

    /**
     * @depends testRegisterConnection
     * @covers Zend\Db\Adapter\Driver\Oci8\Oci8::getConnection
     */
    public function testGetConnection($mockConnection)
    {
        $conn = new \Zend\Db\Adapter\Driver\Oci8\Connection(array());
        $this->oci8->registerConnection($conn);
        $this->assertSame($conn, $this->oci8->getConnection());
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Oci8\Oci8::createStatement
     * @todo   Implement testGetPrepareType().
     */
    public function testCreateStatement()
    {
        // Remove the following lines when you implement this test.
        $this->markTestIncomplete(
            'This test has not been implemented yet.'
        );
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Oci8\Oci8::createResult
     * @todo   Implement testGetPrepareType().
     */
    public function testCreateResult()
    {
        // Remove the following lines when you implement this test.
        $this->markTestIncomplete(
            'This test has not been implemented yet.'
        );
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Oci8\Oci8::getPrepareType
     * @todo   Implement testGetPrepareType().
     */
    public function testGetPrepareType()
    {
        // Remove the following lines when you implement this test.
        $this->markTestIncomplete(
          'This test has not been implemented yet.'
        );
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Oci8\Oci8::formatParameterName
     * @todo   Implement testFormatParameterName().
     */
    public function testFormatParameterName()
    {
        // Remove the following lines when you implement this test.
        $this->markTestIncomplete(
          'This test has not been implemented yet.'
        );
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Oci8\Oci8::getLastGeneratedValue
     * @todo   Implement testGetLastGeneratedValue().
     */
    public function testGetLastGeneratedValue()
    {
        // Remove the following lines when you implement this test.
        $this->markTestIncomplete(
          'This test has not been implemented yet.'
        );
    }

}
