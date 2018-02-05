<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql;

use PHPUnit\Framework\TestCase;
use Zend\Db\Sql\Delete;
use Zend\Db\Sql\Predicate\IsNotNull;
use Zend\Db\Sql\TableIdentifier;
use Zend\Db\Sql\Where;
use ZendTest\Db\TestAsset\DeleteIgnore;

class DeleteTest extends TestCase
{
    /**
     * @var Delete
     */
    protected $delete;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        $this->delete = new Delete;
    }

    /**
     * Tears down the fixture, for example, closes a network connection.
     * This method is called after a test is executed.
     */
    protected function tearDown()
    {
    }

    /**
     * @covers \Zend\Db\Sql\Delete::from
     */
    public function testFrom()
    {
        $this->delete->from('foo', 'bar');
        self::assertEquals('foo', $this->readAttribute($this->delete, 'table'));

        $tableIdentifier = new TableIdentifier('foo', 'bar');
        $this->delete->from($tableIdentifier);
        self::assertEquals($tableIdentifier, $this->readAttribute($this->delete, 'table'));
    }

    /**
     * @covers \Zend\Db\Sql\Delete::where
     *
     * @todo REMOVE THIS IN 3.x
     */
    public function testWhere()
    {
        $this->delete->where('x = y');
        $this->delete->where(['foo > ?' => 5]);
        $this->delete->where(['id' => 2]);
        $this->delete->where(['a = b'], Where::OP_OR);
        $this->delete->where(['c1' => null]);
        $this->delete->where(['c2' => [1, 2, 3]]);
        $this->delete->where([new IsNotNull('c3')]);
        $this->delete->where(['one' => 1, 'two' => 2]);
        $where = $this->delete->where;

        $predicates = $this->readAttribute($where, 'predicates');
        self::assertEquals('AND', $predicates[0][0]);
        self::assertInstanceOf('Zend\Db\Sql\Predicate\Literal', $predicates[0][1]);

        self::assertEquals('AND', $predicates[1][0]);
        self::assertInstanceOf('Zend\Db\Sql\Predicate\Expression', $predicates[1][1]);

        self::assertEquals('AND', $predicates[2][0]);
        self::assertInstanceOf('Zend\Db\Sql\Predicate\Operator', $predicates[2][1]);

        self::assertEquals('OR', $predicates[3][0]);
        self::assertInstanceOf('Zend\Db\Sql\Predicate\Literal', $predicates[3][1]);

        self::assertEquals('AND', $predicates[4][0]);
        self::assertInstanceOf('Zend\Db\Sql\Predicate\IsNull', $predicates[4][1]);

        self::assertEquals('AND', $predicates[5][0]);
        self::assertInstanceOf('Zend\Db\Sql\Predicate\In', $predicates[5][1]);

        self::assertEquals('AND', $predicates[6][0]);
        self::assertInstanceOf('Zend\Db\Sql\Predicate\IsNotNull', $predicates[6][1]);

        self::assertEquals('AND', $predicates[7][0]);
        self::assertInstanceOf('Zend\Db\Sql\Predicate\Operator', $predicates[7][1]);

        self::assertEquals('AND', $predicates[8][0]);
        self::assertInstanceOf('Zend\Db\Sql\Predicate\Operator', $predicates[8][1]);

        $where = new Where;
        $this->delete->where($where);
        self::assertSame($where, $this->delete->where);

        $this->delete->where(function ($what) use ($where) {
            self::assertSame($where, $what);
        });
    }

    /**
     * @covers \Zend\Db\Sql\Delete::prepareStatement
     */
    public function testPrepareStatement()
    {
        $mockDriver = $this->getMockBuilder('Zend\Db\Adapter\Driver\DriverInterface')->getMock();
        $mockAdapter = $this->getMockBuilder('Zend\Db\Adapter\Adapter')
            ->setMethods()
            ->setConstructorArgs([$mockDriver])
            ->getMock();

        $mockStatement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')->getMock();
        $mockStatement->expects($this->at(2))
            ->method('setSql')
            ->with($this->equalTo('DELETE FROM "foo" WHERE x = y'));

        $this->delete->from('foo')
            ->where('x = y');

        $this->delete->prepareStatement($mockAdapter, $mockStatement);

        // with TableIdentifier
        $this->delete = new Delete;
        $mockDriver = $this->getMockBuilder('Zend\Db\Adapter\Driver\DriverInterface')->getMock();
        $mockAdapter = $this->getMockBuilder('Zend\Db\Adapter\Adapter')
            ->setMethods()
            ->setConstructorArgs([$mockDriver])
            ->getMock();

        $mockStatement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')->getMock();
        $mockStatement->expects($this->at(2))
            ->method('setSql')
            ->with($this->equalTo('DELETE FROM "sch"."foo" WHERE x = y'));

        $this->delete->from(new TableIdentifier('foo', 'sch'))
            ->where('x = y');

        $this->delete->prepareStatement($mockAdapter, $mockStatement);
    }

    /**
     * @covers \Zend\Db\Sql\Delete::getSqlString
     */
    public function testGetSqlString()
    {
        $this->delete->from('foo')
            ->where('x = y');
        self::assertEquals('DELETE FROM "foo" WHERE x = y', $this->delete->getSqlString());

        // with TableIdentifier
        $this->delete = new Delete;
        $this->delete->from(new TableIdentifier('foo', 'sch'))
            ->where('x = y');
        self::assertEquals('DELETE FROM "sch"."foo" WHERE x = y', $this->delete->getSqlString());
    }

    /**
     * @coversNothing
     */
    public function testSpecificationconstantsCouldBeOverridedByExtensionInPrepareStatement()
    {
        $deleteIgnore = new DeleteIgnore();

        $mockDriver = $this->getMockBuilder('Zend\Db\Adapter\Driver\DriverInterface')->getMock();
        $mockAdapter = $this->getMockBuilder('Zend\Db\Adapter\Adapter')
            ->setMethods()
            ->setConstructorArgs([$mockDriver])
            ->getMock();

        $mockStatement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')->getMock();
        $mockStatement->expects($this->at(2))
            ->method('setSql')
            ->with($this->equalTo('DELETE IGNORE FROM "foo" WHERE x = y'));

        $deleteIgnore->from('foo')
            ->where('x = y');

        $deleteIgnore->prepareStatement($mockAdapter, $mockStatement);



        // with TableIdentifier
        $deleteIgnore = new DeleteIgnore();

        $mockDriver = $this->getMockBuilder('Zend\Db\Adapter\Driver\DriverInterface')->getMock();
        $mockAdapter = $this->getMockBuilder('Zend\Db\Adapter\Adapter')
            ->setMethods()
            ->setConstructorArgs([$mockDriver])
            ->getMock();

        $mockStatement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')->getMock();
        $mockStatement->expects($this->at(2))
            ->method('setSql')
            ->with($this->equalTo('DELETE IGNORE FROM "sch"."foo" WHERE x = y'));

        $deleteIgnore->from(new TableIdentifier('foo', 'sch'))
            ->where('x = y');

        $deleteIgnore->prepareStatement($mockAdapter, $mockStatement);
    }

    /**
     * @coversNothing
     */
    public function testSpecificationconstantsCouldBeOverridedByExtensionInGetSqlString()
    {
        $deleteIgnore = new DeleteIgnore();

        $deleteIgnore->from('foo')
            ->where('x = y');
        self::assertEquals('DELETE IGNORE FROM "foo" WHERE x = y', $deleteIgnore->getSqlString());

        // with TableIdentifier
        $deleteIgnore = new DeleteIgnore();
        $deleteIgnore->from(new TableIdentifier('foo', 'sch'))
            ->where('x = y');
        self::assertEquals('DELETE IGNORE FROM "sch"."foo" WHERE x = y', $deleteIgnore->getSqlString());
    }
}
