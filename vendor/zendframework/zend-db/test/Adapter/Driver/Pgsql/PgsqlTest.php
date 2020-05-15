<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\Pgsql;

use PHPUnit\Framework\TestCase;
use Zend\Db\Adapter\Driver\Pgsql\Pgsql;

class PgsqlTest extends TestCase
{
    /**
     * @var Pgsql
     */
    protected $pgsql;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        $this->pgsql = new Pgsql([]);
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pgsql\Pgsql::checkEnvironment
     */
    public function testCheckEnvironment()
    {
        if (! extension_loaded('pgsql')) {
            $this->expectException('Zend\Db\Adapter\Exception\RuntimeException');
        }
        $this->pgsql->checkEnvironment();
        self::assertTrue(true, 'No exception was thrown');
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pgsql\Pgsql::registerConnection
     */
    public function testRegisterConnection()
    {
        $mockConnection = $this->getMockForAbstractClass(
            'Zend\Db\Adapter\Driver\Pgsql\Connection',
            [[]],
            '',
            true,
            true,
            true,
            ['setDriver']
        );
        $mockConnection->expects($this->once())->method('setDriver')->with($this->equalTo($this->pgsql));
        self::assertSame($this->pgsql, $this->pgsql->registerConnection($mockConnection));
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pgsql\Pgsql::registerStatementPrototype
     */
    public function testRegisterStatementPrototype()
    {
        $this->pgsql = new Pgsql([]);
        $mockStatement = $this->getMockForAbstractClass(
            'Zend\Db\Adapter\Driver\Pgsql\Statement',
            [],
            '',
            true,
            true,
            true,
            ['setDriver']
        );
        $mockStatement->expects($this->once())->method('setDriver')->with($this->equalTo($this->pgsql));
        self::assertSame($this->pgsql, $this->pgsql->registerStatementPrototype($mockStatement));
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pgsql\Pgsql::registerResultPrototype
     */
    public function testRegisterResultPrototype()
    {
        $this->pgsql = new Pgsql([]);
        $mockStatement = $this->getMockForAbstractClass(
            'Zend\Db\Adapter\Driver\Pgsql\Result',
            [],
            '',
            true,
            true,
            true,
            ['setDriver']
        );
        self::assertSame($this->pgsql, $this->pgsql->registerResultPrototype($mockStatement));
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pgsql\Pgsql::getDatabasePlatformName
     */
    public function testGetDatabasePlatformName()
    {
        $this->pgsql = new Pgsql([]);
        self::assertEquals('Postgresql', $this->pgsql->getDatabasePlatformName());
        self::assertEquals('PostgreSQL', $this->pgsql->getDatabasePlatformName(Pgsql::NAME_FORMAT_NATURAL));
    }

    /**
     * @depends testRegisterConnection
     * @covers \Zend\Db\Adapter\Driver\Pgsql\Pgsql::getConnection
     */
    public function testGetConnection($mockConnection)
    {
        $conn = new \Zend\Db\Adapter\Driver\Pgsql\Connection([]);
        $this->pgsql->registerConnection($conn);
        self::assertSame($conn, $this->pgsql->getConnection());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pgsql\Pgsql::createStatement
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
     * @covers \Zend\Db\Adapter\Driver\Pgsql\Pgsql::createResult
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
     * @covers \Zend\Db\Adapter\Driver\Pgsql\Pgsql::getPrepareType
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
     * @covers \Zend\Db\Adapter\Driver\Pgsql\Pgsql::formatParameterName
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
     * @covers \Zend\Db\Adapter\Driver\Pgsql\Pgsql::getLastGeneratedValue
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
