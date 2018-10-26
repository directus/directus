<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\Sqlsrv;

use PHPUnit\Framework\TestCase;
use Zend\Db\Adapter\Driver\Sqlsrv\Sqlsrv;

class SqlsrvTest extends TestCase
{
    /**
     * @var Sqlsrv
     */
    protected $sqlsrv;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        $this->sqlsrv = new Sqlsrv([]);
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Sqlsrv\Sqlsrv::registerConnection
     */
    public function testRegisterConnection()
    {
        $mockConnection = $this->getMockForAbstractClass(
            'Zend\Db\Adapter\Driver\Sqlsrv\Connection',
            [[]],
            '',
            true,
            true,
            true,
            ['setDriver']
        );
        $mockConnection->expects($this->once())->method('setDriver')->with($this->equalTo($this->sqlsrv));
        self::assertSame($this->sqlsrv, $this->sqlsrv->registerConnection($mockConnection));
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Sqlsrv\Sqlsrv::registerStatementPrototype
     */
    public function testRegisterStatementPrototype()
    {
        $this->sqlsrv = new Sqlsrv([]);
        $mockStatement = $this->getMockForAbstractClass(
            'Zend\Db\Adapter\Driver\Sqlsrv\Statement',
            [],
            '',
            true,
            true,
            true,
            ['setDriver']
        );
        $mockStatement->expects($this->once())->method('setDriver')->with($this->equalTo($this->sqlsrv));
        self::assertSame($this->sqlsrv, $this->sqlsrv->registerStatementPrototype($mockStatement));
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Sqlsrv\Sqlsrv::registerResultPrototype
     */
    public function testRegisterResultPrototype()
    {
        $this->sqlsrv = new Sqlsrv([]);
        $mockStatement = $this->getMockForAbstractClass(
            'Zend\Db\Adapter\Driver\Sqlsrv\Result',
            [],
            '',
            true,
            true,
            true,
            ['setDriver']
        );
        self::assertSame($this->sqlsrv, $this->sqlsrv->registerResultPrototype($mockStatement));
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Sqlsrv\Sqlsrv::getDatabasePlatformName
     */
    public function testGetDatabasePlatformName()
    {
        $this->sqlsrv = new Sqlsrv([]);
        self::assertEquals('SqlServer', $this->sqlsrv->getDatabasePlatformName());
        self::assertEquals('SQLServer', $this->sqlsrv->getDatabasePlatformName(Sqlsrv::NAME_FORMAT_NATURAL));
    }

    /**
     * @depends testRegisterConnection
     * @covers \Zend\Db\Adapter\Driver\Sqlsrv\Sqlsrv::getConnection
     */
    public function testGetConnection($mockConnection)
    {
        $conn = new \Zend\Db\Adapter\Driver\Sqlsrv\Connection([]);
        $this->sqlsrv->registerConnection($conn);
        self::assertSame($conn, $this->sqlsrv->getConnection());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Sqlsrv\Sqlsrv::createStatement
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
     * @covers \Zend\Db\Adapter\Driver\Sqlsrv\Sqlsrv::createResult
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
     * @covers \Zend\Db\Adapter\Driver\Sqlsrv\Sqlsrv::getPrepareType
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
     * @covers \Zend\Db\Adapter\Driver\Sqlsrv\Sqlsrv::formatParameterName
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
     * @covers \Zend\Db\Adapter\Driver\Sqlsrv\Sqlsrv::getLastGeneratedValue
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
