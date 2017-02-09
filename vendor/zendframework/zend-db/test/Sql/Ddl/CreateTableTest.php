<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Ddl;

use Zend\Db\Sql\Ddl\Column\Column;
use Zend\Db\Sql\Ddl\Constraint;
use Zend\Db\Sql\Ddl\CreateTable;

class CreateTableTest extends \PHPUnit_Framework_TestCase
{
    /**
     * test object construction
     * @covers Zend\Db\Sql\Ddl\CreateTable::__construct
     */
    public function testObjectConstruction()
    {
        $ct = new CreateTable('foo', true);
        $this->assertEquals('foo', $ct->getRawState($ct::TABLE));
        $this->assertTrue($ct->isTemporary());
    }

    /**
     * @covers Zend\Db\Sql\Ddl\CreateTable::setTemporary
     */
    public function testSetTemporary()
    {
        $ct = new CreateTable();
        $this->assertSame($ct, $ct->setTemporary(false));
        $this->assertFalse($ct->isTemporary());
        $ct->setTemporary(true);
        $this->assertTrue($ct->isTemporary());
        $ct->setTemporary('yes');
        $this->assertTrue($ct->isTemporary());

        $this->assertStringStartsWith("CREATE TEMPORARY TABLE", $ct->getSqlString());
    }

    /**
     * @covers Zend\Db\Sql\Ddl\CreateTable::isTemporary
     */
    public function testIsTemporary()
    {
        $ct = new CreateTable();
        $this->assertFalse($ct->isTemporary());
        $ct->setTemporary(true);
        $this->assertTrue($ct->isTemporary());
    }

    /**
     * @covers Zend\Db\Sql\Ddl\CreateTable::setTable
     */
    public function testSetTable()
    {
        $ct = new CreateTable();
        $this->assertEquals('', $ct->getRawState('table'));
        $ct->setTable('test');
        return $ct;
    }

    /**
     * @covers Zend\Db\Sql\Ddl\CreateTable::getRawState
     * @depends testSetTable
     */
    public function testRawStateViaTable(CreateTable $ct)
    {
        $this->assertEquals('test', $ct->getRawState('table'));
    }

    /**
     * @covers Zend\Db\Sql\Ddl\CreateTable::addColumn
     */
    public function testAddColumn()
    {
        $column = $this->getMock('Zend\Db\Sql\Ddl\Column\ColumnInterface');
        $ct = new CreateTable;
        $this->assertSame($ct, $ct->addColumn($column));
        return $ct;
    }

    /**
     * @covers Zend\Db\Sql\Ddl\CreateTable::getRawState
     * @depends testAddColumn
     */
    public function testRawStateViaColumn(CreateTable $ct)
    {
        $state = $ct->getRawState('columns');
        $this->assertInternalType('array', $state);
        $column = array_pop($state);
        $this->assertInstanceOf('Zend\Db\Sql\Ddl\Column\ColumnInterface', $column);
    }

    /**
     * @covers Zend\Db\Sql\Ddl\CreateTable::addConstraint
     */
    public function testAddConstraint()
    {
        $constraint = $this->getMock('Zend\Db\Sql\Ddl\Constraint\ConstraintInterface');
        $ct = new CreateTable;
        $this->assertSame($ct, $ct->addConstraint($constraint));
        return $ct;
    }

    /**
     * @covers Zend\Db\Sql\Ddl\CreateTable::getRawState
     * @depends testAddConstraint
     */
    public function testRawStateViaConstraint(CreateTable $ct)
    {
        $state = $ct->getRawState('constraints');
        $this->assertInternalType('array', $state);
        $constraint = array_pop($state);
        $this->assertInstanceOf('Zend\Db\Sql\Ddl\Constraint\ConstraintInterface', $constraint);
    }

    /**
     * @covers Zend\Db\Sql\Ddl\CreateTable::getSqlString
     */
    public function testGetSqlString()
    {
        $ct = new CreateTable('foo');
        $this->assertEquals("CREATE TABLE \"foo\" ( \n)", $ct->getSqlString());

        $ct = new CreateTable('foo', true);
        $this->assertEquals("CREATE TEMPORARY TABLE \"foo\" ( \n)", $ct->getSqlString());

        $ct = new CreateTable('foo');
        $ct->addColumn(new Column('bar'));
        $this->assertEquals("CREATE TABLE \"foo\" ( \n    \"bar\" INTEGER NOT NULL \n)", $ct->getSqlString());

        $ct = new CreateTable('foo', true);
        $ct->addColumn(new Column('bar'));
        $this->assertEquals("CREATE TEMPORARY TABLE \"foo\" ( \n    \"bar\" INTEGER NOT NULL \n)", $ct->getSqlString());

        $ct = new CreateTable('foo', true);
        $ct->addColumn(new Column('bar'));
        $ct->addColumn(new Column('baz'));
        $this->assertEquals("CREATE TEMPORARY TABLE \"foo\" ( \n    \"bar\" INTEGER NOT NULL,\n    \"baz\" INTEGER NOT NULL \n)", $ct->getSqlString());

        $ct = new CreateTable('foo');
        $ct->addColumn(new Column('bar'));
        $ct->addConstraint(new Constraint\PrimaryKey('bat'));
        $this->assertEquals("CREATE TABLE \"foo\" ( \n    \"bar\" INTEGER NOT NULL , \n    PRIMARY KEY (\"bat\") \n)", $ct->getSqlString());

        $ct = new CreateTable('foo');
        $ct->addConstraint(new Constraint\PrimaryKey('bar'));
        $ct->addConstraint(new Constraint\PrimaryKey('bat'));
        $this->assertEquals("CREATE TABLE \"foo\" ( \n    PRIMARY KEY (\"bar\"),\n    PRIMARY KEY (\"bat\") \n)", $ct->getSqlString());
    }
}
