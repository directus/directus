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
use Zend\Db\Sql\Expression;
use Zend\Db\Sql\Insert;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\TableIdentifier;
use ZendTest\Db\TestAsset\Replace;
use ZendTest\Db\TestAsset\TrustingSql92Platform;

class InsertTest extends TestCase
{
    /**
     * @var Insert
     */
    protected $insert;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        $this->insert = new Insert;
    }

    /**
     * @covers \Zend\Db\Sql\Insert::into
     */
    public function testInto()
    {
        $this->insert->into('table', 'schema');
        self::assertEquals('table', $this->insert->getRawState('table'));

        $tableIdentifier = new TableIdentifier('table', 'schema');
        $this->insert->into($tableIdentifier);
        self::assertEquals($tableIdentifier, $this->insert->getRawState('table'));
    }

    /**
     * @covers \Zend\Db\Sql\Insert::columns
     */
    public function testColumns()
    {
        $columns = ['foo', 'bar'];
        $this->insert->columns($columns);
        self::assertEquals($columns, $this->insert->getRawState('columns'));
    }

    /**
     * @covers \Zend\Db\Sql\Insert::values
     */
    public function testValues()
    {
        $this->insert->values(['foo' => 'bar']);
        self::assertEquals(['foo'], $this->insert->getRawState('columns'));
        self::assertEquals(['bar'], $this->insert->getRawState('values'));

        // test will merge cols and values of previously set stuff
        $this->insert->values(['foo' => 'bax'], Insert::VALUES_MERGE);
        $this->insert->values(['boom' => 'bam'], Insert::VALUES_MERGE);
        self::assertEquals(['foo', 'boom'], $this->insert->getRawState('columns'));
        self::assertEquals(['bax', 'bam'], $this->insert->getRawState('values'));

        $this->insert->values(['foo' => 'bax']);
        self::assertEquals(['foo'], $this->insert->getRawState('columns'));
        self::assertEquals(['bax'], $this->insert->getRawState('values'));
    }

    /**
     * @covers \Zend\Db\Sql\Insert::values
     */
    public function testValuesThrowsExceptionWhenNotArrayOrSelect()
    {
        $this->expectException('Zend\Db\Sql\Exception\InvalidArgumentException');
        $this->expectExceptionMessage('values() expects an array of values or Zend\Db\Sql\Select instance');
        $this->insert->values(5);
    }

    /**
     * @covers \Zend\Db\Sql\Insert::values
     */
    public function testValuesThrowsExceptionWhenSelectMergeOverArray()
    {
        $this->insert->values(['foo' => 'bar']);

        $this->expectException('Zend\Db\Sql\Exception\InvalidArgumentException');
        $this->expectExceptionMessage('A Zend\Db\Sql\Select instance cannot be provided with the merge flag');
        $this->insert->values(new Select, Insert::VALUES_MERGE);
    }

    /**
     * @covers \Zend\Db\Sql\Insert::values
     */
    public function testValuesThrowsExceptionWhenArrayMergeOverSelect()
    {
        $this->insert->values(new Select);

        $this->expectException('Zend\Db\Sql\Exception\InvalidArgumentException');
        $this->expectExceptionMessage(
            'An array of values cannot be provided with the merge flag when a Zend\Db\Sql\Select instance already '
            . 'exists as the value source'
        );
        $this->insert->values(['foo' => 'bar'], Insert::VALUES_MERGE);
    }

    /**
     * @covers \Zend\Db\Sql\Insert::values
     * @group ZF2-4926
     */
    public function testEmptyArrayValues()
    {
        $this->insert->values([]);
        self::assertEquals([], $this->readAttribute($this->insert, 'columns'));
    }

    /**
     * @covers \Zend\Db\Sql\Insert::prepareStatement
     */
    public function testPrepareStatement()
    {
        $mockDriver = $this->getMockBuilder('Zend\Db\Adapter\Driver\DriverInterface')->getMock();
        $mockDriver->expects($this->any())->method('getPrepareType')->will($this->returnValue('positional'));
        $mockDriver->expects($this->any())->method('formatParameterName')->will($this->returnValue('?'));
        $mockAdapter = $this->getMockBuilder('Zend\Db\Adapter\Adapter')
            ->setMethods()
            ->setConstructorArgs([$mockDriver])
            ->getMock();

        $mockStatement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')->getMock();
        $pContainer = new \Zend\Db\Adapter\ParameterContainer([]);
        $mockStatement->expects($this->any())->method('getParameterContainer')->will($this->returnValue($pContainer));
        $mockStatement->expects($this->at(1))
            ->method('setSql')
            ->with($this->equalTo('INSERT INTO "foo" ("bar", "boo") VALUES (?, NOW())'));

        $this->insert->into('foo')
            ->values(['bar' => 'baz', 'boo' => new Expression('NOW()')]);

        $this->insert->prepareStatement($mockAdapter, $mockStatement);

        // with TableIdentifier
        $this->insert = new Insert;
        $mockDriver = $this->getMockBuilder('Zend\Db\Adapter\Driver\DriverInterface')->getMock();
        $mockDriver->expects($this->any())->method('getPrepareType')->will($this->returnValue('positional'));
        $mockDriver->expects($this->any())->method('formatParameterName')->will($this->returnValue('?'));
        $mockAdapter = $this->getMockBuilder('Zend\Db\Adapter\Adapter')
            ->setMethods()
            ->setConstructorArgs([$mockDriver])
            ->getMock();

        $mockStatement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')->getMock();
        $pContainer = new \Zend\Db\Adapter\ParameterContainer([]);
        $mockStatement->expects($this->any())->method('getParameterContainer')->will($this->returnValue($pContainer));
        $mockStatement->expects($this->at(1))
            ->method('setSql')
            ->with($this->equalTo('INSERT INTO "sch"."foo" ("bar", "boo") VALUES (?, NOW())'));

        $this->insert->into(new TableIdentifier('foo', 'sch'))
            ->values(['bar' => 'baz', 'boo' => new Expression('NOW()')]);

        $this->insert->prepareStatement($mockAdapter, $mockStatement);
    }

    /**
     * @covers \Zend\Db\Sql\Insert::prepareStatement
     */
    public function testPrepareStatementWithSelect()
    {
        $mockDriver = $this->getMockBuilder('Zend\Db\Adapter\Driver\DriverInterface')->getMock();
        $mockDriver->expects($this->any())->method('getPrepareType')->will($this->returnValue('positional'));
        $mockDriver->expects($this->any())->method('formatParameterName')->will($this->returnValue('?'));
        $mockAdapter = $this->getMockBuilder('Zend\Db\Adapter\Adapter')
            ->setMethods()
            ->setConstructorArgs([$mockDriver])
            ->getMock();

        $mockStatement = new \Zend\Db\Adapter\StatementContainer();

        $select = new Select('bar');
        $this->insert
                ->into('foo')
                ->columns(['col1'])
                ->select($select->where(['x' => 5]))
                ->prepareStatement($mockAdapter, $mockStatement);

        self::assertEquals(
            'INSERT INTO "foo" ("col1") SELECT "bar".* FROM "bar" WHERE "x" = ?',
            $mockStatement->getSql()
        );
        $parameters = $mockStatement->getParameterContainer()->getNamedArray();
        self::assertSame(['subselect1where1' => 5], $parameters);
    }

    /**
     * @covers \Zend\Db\Sql\Insert::getSqlString
     */
    public function testGetSqlString()
    {
        $this->insert->into('foo')
            ->values(['bar' => 'baz', 'boo' => new Expression('NOW()'), 'bam' => null]);

        self::assertEquals(
            'INSERT INTO "foo" ("bar", "boo", "bam") VALUES (\'baz\', NOW(), NULL)',
            $this->insert->getSqlString(new TrustingSql92Platform())
        );

        // with TableIdentifier
        $this->insert = new Insert;
        $this->insert->into(new TableIdentifier('foo', 'sch'))
            ->values(['bar' => 'baz', 'boo' => new Expression('NOW()'), 'bam' => null]);

        self::assertEquals(
            'INSERT INTO "sch"."foo" ("bar", "boo", "bam") VALUES (\'baz\', NOW(), NULL)',
            $this->insert->getSqlString(new TrustingSql92Platform())
        );

        // with Select
        $this->insert = new Insert;
        $select = new Select();
        $this->insert->into('foo')->select($select->from('bar'));

        self::assertEquals(
            'INSERT INTO "foo"  SELECT "bar".* FROM "bar"',
            $this->insert->getSqlString(new TrustingSql92Platform())
        );

        // with Select and columns
        $this->insert->columns(['col1', 'col2']);
        self::assertEquals(
            'INSERT INTO "foo" ("col1", "col2") SELECT "bar".* FROM "bar"',
            $this->insert->getSqlString(new TrustingSql92Platform())
        );
    }

    public function testGetSqlStringUsingColumnsAndValuesMethods()
    {
        // With columns() and values()
        $this->insert
            ->into('foo')
            ->columns(['col1', 'col2', 'col3'])
            ->values(['val1', 'val2', 'val3']);
        self::assertEquals(
            'INSERT INTO "foo" ("col1", "col2", "col3") VALUES (\'val1\', \'val2\', \'val3\')',
            $this->insert->getSqlString(new TrustingSql92Platform())
        );
    }

    /**
     * @covers \Zend\Db\Sql\Insert::__set
     */
    // @codingStandardsIgnoreStart
    public function test__set()
    {
        // @codingStandardsIgnoreEnd
        $this->insert->foo = 'bar';
        self::assertEquals(['foo'], $this->insert->getRawState('columns'));
        self::assertEquals(['bar'], $this->insert->getRawState('values'));
    }

    /**
     * @covers \Zend\Db\Sql\Insert::__unset
     */
    // @codingStandardsIgnoreStart
    public function test__unset()
    {
        // @codingStandardsIgnoreEnd
        $this->insert->foo = 'bar';
        self::assertEquals(['foo'], $this->insert->getRawState('columns'));
        self::assertEquals(['bar'], $this->insert->getRawState('values'));
        unset($this->insert->foo);
        self::assertEquals([], $this->insert->getRawState('columns'));
        self::assertEquals([], $this->insert->getRawState('values'));

        $this->insert->foo = null;
        self::assertEquals(['foo'], $this->insert->getRawState('columns'));
        self::assertEquals([null], $this->insert->getRawState('values'));

        unset($this->insert->foo);
        self::assertEquals([], $this->insert->getRawState('columns'));
        self::assertEquals([], $this->insert->getRawState('values'));
    }

    /**
     * @covers \Zend\Db\Sql\Insert::__isset
     */
    // @codingStandardsIgnoreStart
    public function test__isset()
    {
        // @codingStandardsIgnoreEnd
        $this->insert->foo = 'bar';
        self::assertTrue(isset($this->insert->foo));

        $this->insert->foo = null;
        self::assertTrue(isset($this->insert->foo));
    }

    /**
     * @covers \Zend\Db\Sql\Insert::__get
     */
    // @codingStandardsIgnoreStart
    public function test__get()
    {
        // @codingStandardsIgnoreEnd
        $this->insert->foo = 'bar';
        self::assertEquals('bar', $this->insert->foo);

        $this->insert->foo = null;
        self::assertNull($this->insert->foo);
    }

    /**
     * @group ZF2-536
     */
    public function testValuesMerge()
    {
        $this->insert->into('foo')
            ->values(['bar' => 'baz', 'boo' => new Expression('NOW()'), 'bam' => null]);
        $this->insert->into('foo')
            ->values(['qux' => 100], Insert::VALUES_MERGE);

        self::assertEquals(
            'INSERT INTO "foo" ("bar", "boo", "bam", "qux") VALUES (\'baz\', NOW(), NULL, \'100\')',
            $this->insert->getSqlString(new TrustingSql92Platform())
        );
    }

    /**
     * @coversNothing
     */
    public function testSpecificationconstantsCouldBeOverridedByExtensionInPrepareStatement()
    {
        $replace = new Replace();

        $mockDriver = $this->getMockBuilder('Zend\Db\Adapter\Driver\DriverInterface')->getMock();
        $mockDriver->expects($this->any())->method('getPrepareType')->will($this->returnValue('positional'));
        $mockDriver->expects($this->any())->method('formatParameterName')->will($this->returnValue('?'));
        $mockAdapter = $this->getMockBuilder('Zend\Db\Adapter\Adapter')
            ->setMethods()
            ->setConstructorArgs([$mockDriver])
            ->getMock();

        $mockStatement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')->getMock();
        $pContainer = new \Zend\Db\Adapter\ParameterContainer([]);
        $mockStatement->expects($this->any())->method('getParameterContainer')->will($this->returnValue($pContainer));
        $mockStatement->expects($this->at(1))
            ->method('setSql')
            ->with($this->equalTo('REPLACE INTO "foo" ("bar", "boo") VALUES (?, NOW())'));

        $replace->into('foo')
            ->values(['bar' => 'baz', 'boo' => new Expression('NOW()')]);

        $replace->prepareStatement($mockAdapter, $mockStatement);

        // with TableIdentifier
        $replace = new Replace();

        $mockDriver = $this->getMockBuilder('Zend\Db\Adapter\Driver\DriverInterface')->getMock();
        $mockDriver->expects($this->any())->method('getPrepareType')->will($this->returnValue('positional'));
        $mockDriver->expects($this->any())->method('formatParameterName')->will($this->returnValue('?'));
        $mockAdapter = $this->getMockBuilder('Zend\Db\Adapter\Adapter')
            ->setMethods()
            ->setConstructorArgs([$mockDriver])
            ->getMock();

        $mockStatement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')->getMock();
        $pContainer = new \Zend\Db\Adapter\ParameterContainer([]);
        $mockStatement->expects($this->any())->method('getParameterContainer')->will($this->returnValue($pContainer));
        $mockStatement->expects($this->at(1))
            ->method('setSql')
            ->with($this->equalTo('REPLACE INTO "sch"."foo" ("bar", "boo") VALUES (?, NOW())'));

        $replace->into(new TableIdentifier('foo', 'sch'))
            ->values(['bar' => 'baz', 'boo' => new Expression('NOW()')]);

        $replace->prepareStatement($mockAdapter, $mockStatement);
    }

    /**
     * @coversNothing
     */
    public function testSpecificationconstantsCouldBeOverridedByExtensionInGetSqlString()
    {
        $replace = new Replace();
        $replace->into('foo')
            ->values(['bar' => 'baz', 'boo' => new Expression('NOW()'), 'bam' => null]);

        self::assertEquals(
            'REPLACE INTO "foo" ("bar", "boo", "bam") VALUES (\'baz\', NOW(), NULL)',
            $replace->getSqlString(new TrustingSql92Platform())
        );

        // with TableIdentifier
        $replace = new Replace();
        $replace->into(new TableIdentifier('foo', 'sch'))
            ->values(['bar' => 'baz', 'boo' => new Expression('NOW()'), 'bam' => null]);

        self::assertEquals(
            'REPLACE INTO "sch"."foo" ("bar", "boo", "bam") VALUES (\'baz\', NOW(), NULL)',
            $replace->getSqlString(new TrustingSql92Platform())
        );
    }
}
