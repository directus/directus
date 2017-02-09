<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql;

use Zend\Db\Sql\Sql;
use ZendTest\Db\TestAsset;
use Zend\Db\Adapter\Adapter;

class SqlTest extends \PHPUnit_Framework_TestCase
{
    protected $mockAdapter = null;

    /**
     * Sql object
     * @var Sql
     */
    protected $sql = null;

    public function setup()
    {
        // mock the adapter, driver, and parts
        $mockResult = $this->getMock('Zend\Db\Adapter\Driver\ResultInterface');
        $mockStatement = $this->getMock('Zend\Db\Adapter\Driver\StatementInterface');
        $mockStatement->expects($this->any())->method('execute')->will($this->returnValue($mockResult));
        $mockConnection = $this->getMock('Zend\Db\Adapter\Driver\ConnectionInterface');
        $mockDriver = $this->getMock('Zend\Db\Adapter\Driver\DriverInterface');
        $mockDriver->expects($this->any())->method('createStatement')->will($this->returnValue($mockStatement));
        $mockDriver->expects($this->any())->method('getConnection')->will($this->returnValue($mockConnection));
        $mockDriver->expects($this->any())->method('formatParameterName')->will($this->returnValue('?'));

        // setup mock adapter
        $this->mockAdapter = $this->getMock('Zend\Db\Adapter\Adapter', null, [$mockDriver, new TestAsset\TrustingSql92Platform()]);

        $this->sql = new Sql($this->mockAdapter, 'foo');
    }

    /**
     * @covers Zend\Db\Sql\Sql::__construct
     */
    public function test__construct()
    {
        $sql = new Sql($this->mockAdapter);

        $this->assertFalse($sql->hasTable());

        $sql->setTable('foo');
        $this->assertSame('foo', $sql->getTable());

        $this->setExpectedException('Zend\Db\Sql\Exception\InvalidArgumentException', 'Table must be a string, array or instance of TableIdentifier.');
        $sql->setTable(null);
    }

    /**
     * @covers Zend\Db\Sql\Sql::select
     */
    public function testSelect()
    {
        $select = $this->sql->select();
        $this->assertInstanceOf('Zend\Db\Sql\Select', $select);
        $this->assertSame('foo', $select->getRawState('table'));

        $this->setExpectedException('Zend\Db\Sql\Exception\InvalidArgumentException',
            'This Sql object is intended to work with only the table "foo" provided at construction time.');
        $this->sql->select('bar');
    }

    /**
     * @covers Zend\Db\Sql\Sql::insert
     */
    public function testInsert()
    {
        $insert = $this->sql->insert();
        $this->assertInstanceOf('Zend\Db\Sql\Insert', $insert);
        $this->assertSame('foo', $insert->getRawState('table'));

        $this->setExpectedException('Zend\Db\Sql\Exception\InvalidArgumentException',
            'This Sql object is intended to work with only the table "foo" provided at construction time.');
        $this->sql->insert('bar');
    }

    /**
     * @covers Zend\Db\Sql\Sql::update
     */
    public function testUpdate()
    {
        $update = $this->sql->update();
        $this->assertInstanceOf('Zend\Db\Sql\Update', $update);
        $this->assertSame('foo', $update->getRawState('table'));

        $this->setExpectedException('Zend\Db\Sql\Exception\InvalidArgumentException',
            'This Sql object is intended to work with only the table "foo" provided at construction time.');
        $this->sql->update('bar');
    }

    /**
     * @covers Zend\Db\Sql\Sql::delete
     */
    public function testDelete()
    {
        $delete = $this->sql->delete();

        $this->assertInstanceOf('Zend\Db\Sql\Delete', $delete);
        $this->assertSame('foo', $delete->getRawState('table'));

        $this->setExpectedException('Zend\Db\Sql\Exception\InvalidArgumentException',
            'This Sql object is intended to work with only the table "foo" provided at construction time.');
        $this->sql->delete('bar');
    }

    /**
     * @covers Zend\Db\Sql\Sql::prepareStatementForSqlObject
     */
    public function testPrepareStatementForSqlObject()
    {
        $insert = $this->sql->insert()->columns(['foo'])->values(['foo'=>'bar']);
        $stmt = $this->sql->prepareStatementForSqlObject($insert);
        $this->assertInstanceOf('Zend\Db\Adapter\Driver\StatementInterface', $stmt);
    }

    /**
     * @group 6890
     */
    public function testForDifferentAdapters()
    {
        $adapterSql92     = $this->getAdapterForPlatform('sql92');
        $adapterMySql     = $this->getAdapterForPlatform('MySql');
        $adapterOracle    = $this->getAdapterForPlatform('Oracle');
        $adapterSqlServer = $this->getAdapterForPlatform('SqlServer');

        $select = $this->sql->select()->offset(10);

        // Default
        $this->assertEquals(
            'SELECT "foo".* FROM "foo" OFFSET \'10\'',
            $this->sql->buildSqlString($select)
        );
        $this->mockAdapter->getDriver()->createStatement()->expects($this->any())->method('setSql')
                ->with($this->equalTo('SELECT "foo".* FROM "foo" OFFSET ?'));
        $this->sql->prepareStatementForSqlObject($select);

        // Sql92
        $this->assertEquals(
            'SELECT "foo".* FROM "foo" OFFSET \'10\'',
            $this->sql->buildSqlString($select, $adapterSql92)
        );
        $adapterSql92->getDriver()->createStatement()->expects($this->any())->method('setSql')
                ->with($this->equalTo('SELECT "foo".* FROM "foo" OFFSET ?'));
        $this->sql->prepareStatementForSqlObject($select, null, $adapterSql92);

        // MySql
        $this->assertEquals(
            'SELECT `foo`.* FROM `foo` LIMIT 18446744073709551615 OFFSET 10',
            $this->sql->buildSqlString($select, $adapterMySql)
        );
        $adapterMySql->getDriver()->createStatement()->expects($this->any())->method('setSql')
                ->with($this->equalTo('SELECT `foo`.* FROM `foo` LIMIT 18446744073709551615 OFFSET ?'));
        $this->sql->prepareStatementForSqlObject($select, null, $adapterMySql);

        // Oracle
        $this->assertEquals(
            'SELECT * FROM (SELECT b.*, rownum b_rownum FROM ( SELECT "foo".* FROM "foo" ) b ) WHERE b_rownum > (10)',
            $this->sql->buildSqlString($select, $adapterOracle)
        );
        $adapterOracle->getDriver()->createStatement()->expects($this->any())->method('setSql')
                ->with($this->equalTo('SELECT * FROM (SELECT b.*, rownum b_rownum FROM ( SELECT "foo".* FROM "foo" ) b ) WHERE b_rownum > (:offset)'));
        $this->sql->prepareStatementForSqlObject($select, null, $adapterOracle);

        // SqlServer
        $this->assertContains(
            'WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN 10+1 AND 0+10',
            $this->sql->buildSqlString($select, $adapterSqlServer)
        );
        $adapterSqlServer->getDriver()->createStatement()->expects($this->any())->method('setSql')
                ->with($this->stringContains('WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN ?+1 AND ?+?'));
        $this->sql->prepareStatementForSqlObject($select, null, $adapterSqlServer);
    }

    /**
     * Data provider
     *
     * @param string $platform
     *
     * @return Adapter
     */
    protected function getAdapterForPlatform($platform)
    {
        switch ($platform) {
            case 'sql92'     : $platform  = new TestAsset\TrustingSql92Platform();     break;
            case 'MySql'     : $platform  = new TestAsset\TrustingMysqlPlatform();     break;
            case 'Oracle'    : $platform  = new TestAsset\TrustingOraclePlatform();    break;
            case 'SqlServer' : $platform  = new TestAsset\TrustingSqlServerPlatform(); break;
            default : $platform = null;
        }

        $mockStatement = $this->getMock('Zend\Db\Adapter\Driver\StatementInterface');
        $mockDriver = $this->getMock('Zend\Db\Adapter\Driver\DriverInterface');
        $mockDriver->expects($this->any())->method('formatParameterName')->will($this->returnValue('?'));
        $mockDriver->expects($this->any())->method('createStatement')->will($this->returnValue($mockStatement));

        return new Adapter($mockDriver, $platform);
    }
}
