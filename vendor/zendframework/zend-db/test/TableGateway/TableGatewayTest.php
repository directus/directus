<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\TableGateway;

use PHPUnit\Framework\TestCase;
use Zend\Db\ResultSet\ResultSet;
use Zend\Db\Sql\Insert;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\TableIdentifier;
use Zend\Db\Sql\Update;
use Zend\Db\TableGateway\Feature;
use Zend\Db\TableGateway\TableGateway;

class TableGatewayTest extends TestCase
{
    protected $mockAdapter;

    protected function setUp()
    {
        // mock the adapter, driver, and parts
        $mockResult = $this->getMockBuilder('Zend\Db\Adapter\Driver\ResultInterface')->getMock();
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

    /**
     * Beside other tests checks for plain string table identifier
     */
    public function testConstructor()
    {
        // constructor with only required args
        $table = new TableGateway(
            'foo',
            $this->mockAdapter
        );

        self::assertEquals('foo', $table->getTable());
        self::assertSame($this->mockAdapter, $table->getAdapter());
        self::assertInstanceOf('Zend\Db\TableGateway\Feature\FeatureSet', $table->getFeatureSet());
        self::assertInstanceOf('Zend\Db\ResultSet\ResultSet', $table->getResultSetPrototype());
        self::assertInstanceOf('Zend\Db\Sql\Sql', $table->getSql());

        // injecting all args
        $table = new TableGateway(
            'foo',
            $this->mockAdapter,
            $featureSet = new Feature\FeatureSet,
            $resultSet = new ResultSet,
            $sql = new Sql($this->mockAdapter, 'foo')
        );

        self::assertEquals('foo', $table->getTable());
        self::assertSame($this->mockAdapter, $table->getAdapter());
        self::assertSame($featureSet, $table->getFeatureSet());
        self::assertSame($resultSet, $table->getResultSetPrototype());
        self::assertSame($sql, $table->getSql());

        // constructor expects exception
        $this->expectException('Zend\Db\TableGateway\Exception\InvalidArgumentException');
        $this->expectExceptionMessage('Table name must be a string or an instance of Zend\Db\Sql\TableIdentifier');
        new TableGateway(
            null,
            $this->mockAdapter
        );
    }

    /**
     * @group 6726
     * @group 6740
     */
    public function testTableAsString()
    {
        $ti = 'fooTable.barSchema';
        // constructor with only required args
        $table = new TableGateway(
            $ti,
            $this->mockAdapter
        );

        self::assertEquals($ti, $table->getTable());
    }

    /**
     * @group 6726
     * @group 6740
     */
    public function testTableAsTableIdentifierObject()
    {
        $ti = new TableIdentifier('fooTable', 'barSchema');
        // constructor with only required args
        $table = new TableGateway(
            $ti,
            $this->mockAdapter
        );

        self::assertEquals($ti, $table->getTable());
    }

    /**
     * @group 6726
     * @group 6740
     */
    public function testTableAsAliasedTableIdentifierObject()
    {
        $aliasedTI = ['foo' => new TableIdentifier('fooTable', 'barSchema')];
        // constructor with only required args
        $table = new TableGateway(
            $aliasedTI,
            $this->mockAdapter
        );

        self::assertEquals($aliasedTI, $table->getTable());
    }

    public function aliasedTables()
    {
        $identifier = new TableIdentifier('Users');
        return [
            'simple-alias'     => [['U' => 'Users'], 'Users'],
            'identifier-alias' => [['U' => $identifier], $identifier],
        ];
    }

    /**
     * @group 7311
     * @dataProvider aliasedTables
     */
    public function testInsertShouldResetTableToUnaliasedTable($tableValue, $expected)
    {
        $insert = new Insert();
        $insert->into($tableValue);

        $result = $this->getMockBuilder('Zend\Db\Adapter\Driver\ResultInterface')
            ->getMock();
        $result->expects($this->once())
            ->method('getAffectedRows')
            ->will($this->returnValue(1));

        $statement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')
            ->getMock();
        $statement->expects($this->once())
            ->method('execute')
            ->will($this->returnValue($result));

        $statementExpectation = function ($insert) use ($expected, $statement) {
            $state = $insert->getRawState();
            self::assertSame($expected, $state['table']);
            return $statement;
        };

        $sql = $this->getMockBuilder('Zend\Db\Sql\Sql')
            ->disableOriginalConstructor()
            ->getMock();
        $sql->expects($this->atLeastOnce())
            ->method('getTable')
            ->will($this->returnValue($tableValue));
        $sql->expects($this->once())
            ->method('insert')
            ->will($this->returnValue($insert));
        $sql->expects($this->once())
            ->method('prepareStatementForSqlObject')
            ->with($this->equalTo($insert))
            ->will($this->returnCallback($statementExpectation));

        $table = new TableGateway(
            $tableValue,
            $this->mockAdapter,
            null,
            null,
            $sql
        );

        $result = $table->insert([
            'foo' => 'FOO',
        ]);

        $state = $insert->getRawState();
        self::assertInternalType('array', $state['table']);
        self::assertEquals(
            $tableValue,
            $state['table']
        );
    }

    /**
     * @dataProvider aliasedTables
     */
    public function testUpdateShouldResetTableToUnaliasedTable($tableValue, $expected)
    {
        $update = new Update();
        $update->table($tableValue);

        $result = $this->getMockBuilder('Zend\Db\Adapter\Driver\ResultInterface')
            ->getMock();
        $result->expects($this->once())
            ->method('getAffectedRows')
            ->will($this->returnValue(1));

        $statement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')
            ->getMock();
        $statement->expects($this->once())
            ->method('execute')
            ->will($this->returnValue($result));

        $statementExpectation = function ($update) use ($expected, $statement) {
            $state = $update->getRawState();
            self::assertSame($expected, $state['table']);
            return $statement;
        };

        $sql = $this->getMockBuilder('Zend\Db\Sql\Sql')
            ->disableOriginalConstructor()
            ->getMock();
        $sql->expects($this->atLeastOnce())
            ->method('getTable')
            ->will($this->returnValue($tableValue));
        $sql->expects($this->once())
            ->method('update')
            ->will($this->returnValue($update));
        $sql->expects($this->once())
            ->method('prepareStatementForSqlObject')
            ->with($this->equalTo($update))
            ->will($this->returnCallback($statementExpectation));

        $table = new TableGateway(
            $tableValue,
            $this->mockAdapter,
            null,
            null,
            $sql
        );

        $result = $table->update([
            'foo' => 'FOO',
        ], [
            'bar' => 'BAR',
        ]);

        $state = $update->getRawState();
        self::assertInternalType('array', $state['table']);
        self::assertEquals(
            $tableValue,
            $state['table']
        );
    }
}
