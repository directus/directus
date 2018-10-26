<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Ddl;

use PHPUnit\Framework\TestCase;
use Zend\Db\Sql\Ddl\Column\Column;
use Zend\Db\Sql\Ddl\Constraint;
use Zend\Db\Sql\Ddl\CreateTable;

class CreateTableTest extends TestCase
{
    /**
     * test object construction
     * @covers \Zend\Db\Sql\Ddl\CreateTable::__construct
     */
    public function testObjectConstruction()
    {
        $ct = new CreateTable('foo', true);
        self::assertEquals('foo', $ct->getRawState($ct::TABLE));
        self::assertTrue($ct->isTemporary());
    }

    /**
     * @covers \Zend\Db\Sql\Ddl\CreateTable::setTemporary
     */
    public function testSetTemporary()
    {
        $ct = new CreateTable();
        self::assertSame($ct, $ct->setTemporary(false));
        self::assertFalse($ct->isTemporary());
        $ct->setTemporary(true);
        self::assertTrue($ct->isTemporary());
        $ct->setTemporary('yes');
        self::assertTrue($ct->isTemporary());

        self::assertStringStartsWith("CREATE TEMPORARY TABLE", $ct->getSqlString());
    }

    /**
     * @covers \Zend\Db\Sql\Ddl\CreateTable::isTemporary
     */
    public function testIsTemporary()
    {
        $ct = new CreateTable();
        self::assertFalse($ct->isTemporary());
        $ct->setTemporary(true);
        self::assertTrue($ct->isTemporary());
    }

    /**
     * @covers \Zend\Db\Sql\Ddl\CreateTable::setTable
     */
    public function testSetTable()
    {
        $ct = new CreateTable();
        self::assertEquals('', $ct->getRawState('table'));
        $ct->setTable('test');
        return $ct;
    }

    /**
     * @covers \Zend\Db\Sql\Ddl\CreateTable::getRawState
     * @depends testSetTable
     */
    public function testRawStateViaTable(CreateTable $ct)
    {
        self::assertEquals('test', $ct->getRawState('table'));
    }

    /**
     * @covers \Zend\Db\Sql\Ddl\CreateTable::addColumn
     */
    public function testAddColumn()
    {
        $column = $this->getMockBuilder('Zend\Db\Sql\Ddl\Column\ColumnInterface')->getMock();
        $ct = new CreateTable;
        self::assertSame($ct, $ct->addColumn($column));
        return $ct;
    }

    /**
     * @covers \Zend\Db\Sql\Ddl\CreateTable::getRawState
     * @depends testAddColumn
     */
    public function testRawStateViaColumn(CreateTable $ct)
    {
        $state = $ct->getRawState('columns');
        self::assertInternalType('array', $state);
        $column = array_pop($state);
        self::assertInstanceOf('Zend\Db\Sql\Ddl\Column\ColumnInterface', $column);
    }

    /**
     * @covers \Zend\Db\Sql\Ddl\CreateTable::addConstraint
     */
    public function testAddConstraint()
    {
        $constraint = $this->getMockBuilder('Zend\Db\Sql\Ddl\Constraint\ConstraintInterface')->getMock();
        $ct = new CreateTable;
        self::assertSame($ct, $ct->addConstraint($constraint));
        return $ct;
    }

    /**
     * @covers \Zend\Db\Sql\Ddl\CreateTable::getRawState
     * @depends testAddConstraint
     */
    public function testRawStateViaConstraint(CreateTable $ct)
    {
        $state = $ct->getRawState('constraints');
        self::assertInternalType('array', $state);
        $constraint = array_pop($state);
        self::assertInstanceOf('Zend\Db\Sql\Ddl\Constraint\ConstraintInterface', $constraint);
    }

    /**
     * @covers \Zend\Db\Sql\Ddl\CreateTable::getSqlString
     */
    public function testGetSqlString()
    {
        $ct = new CreateTable('foo');
        self::assertEquals("CREATE TABLE \"foo\" ( \n)", $ct->getSqlString());

        $ct = new CreateTable('foo', true);
        self::assertEquals("CREATE TEMPORARY TABLE \"foo\" ( \n)", $ct->getSqlString());

        $ct = new CreateTable('foo');
        $ct->addColumn(new Column('bar'));
        self::assertEquals("CREATE TABLE \"foo\" ( \n    \"bar\" INTEGER NOT NULL \n)", $ct->getSqlString());

        $ct = new CreateTable('foo', true);
        $ct->addColumn(new Column('bar'));
        self::assertEquals("CREATE TEMPORARY TABLE \"foo\" ( \n    \"bar\" INTEGER NOT NULL \n)", $ct->getSqlString());

        $ct = new CreateTable('foo', true);
        $ct->addColumn(new Column('bar'));
        $ct->addColumn(new Column('baz'));
        self::assertEquals(
            "CREATE TEMPORARY TABLE \"foo\" ( \n    \"bar\" INTEGER NOT NULL,\n    \"baz\" INTEGER NOT NULL \n)",
            $ct->getSqlString()
        );

        $ct = new CreateTable('foo');
        $ct->addColumn(new Column('bar'));
        $ct->addConstraint(new Constraint\PrimaryKey('bat'));
        self::assertEquals(
            "CREATE TABLE \"foo\" ( \n    \"bar\" INTEGER NOT NULL , \n    PRIMARY KEY (\"bat\") \n)",
            $ct->getSqlString()
        );

        $ct = new CreateTable('foo');
        $ct->addConstraint(new Constraint\PrimaryKey('bar'));
        $ct->addConstraint(new Constraint\PrimaryKey('bat'));
        self::assertEquals(
            "CREATE TABLE \"foo\" ( \n    PRIMARY KEY (\"bar\"),\n    PRIMARY KEY (\"bat\") \n)",
            $ct->getSqlString()
        );
    }
}
