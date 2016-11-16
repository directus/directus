<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\Column;

class ColumnTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @covers Zend\Db\Sql\Ddl\Column\Column::setName
     */
    public function testSetName()
    {
        $column = new Column();
        $this->assertSame($column, $column->setName('foo'));
        return $column;
    }

    /**
     * @covers Zend\Db\Sql\Ddl\Column\Column::getName
     * @depends testSetName
     */
    public function testGetName(Column $column)
    {
        $this->assertEquals('foo', $column->getName());
    }

    /**
     * @covers Zend\Db\Sql\Ddl\Column\Column::setNullable
     */
    public function testSetNullable()
    {
        $column = new Column;
        $this->assertSame($column, $column->setNullable(true));
        return $column;
    }

    /**
     * @covers Zend\Db\Sql\Ddl\Column\Column::isNullable
     * @depends testSetNullable
     */
    public function testIsNullable(Column $column)
    {
        $this->assertTrue($column->isNullable());
        $column->setNullable(false);
        $this->assertFalse($column->isNullable());
    }

    /**
     * @covers Zend\Db\Sql\Ddl\Column\Column::setDefault
     */
    public function testSetDefault()
    {
        $column = new Column;
        $this->assertSame($column, $column->setDefault('foo bar'));
        return $column;
    }

    /**
     * @covers Zend\Db\Sql\Ddl\Column\Column::getDefault
     * @depends testSetDefault
     */
    public function testGetDefault(Column $column)
    {
        $this->assertEquals('foo bar', $column->getDefault());
    }

    /**
     * @covers Zend\Db\Sql\Ddl\Column\Column::setOptions
     */
    public function testSetOptions()
    {
        $column = new Column;
        $this->assertSame($column, $column->setOptions(array('autoincrement' => true)));
        return $column;
    }

    /**
     * @covers Zend\Db\Sql\Ddl\Column\Column::setOption
     */
    public function testSetOption()
    {
        $column = new Column;
        $this->assertSame($column, $column->setOption('primary', true));
    }

    /**
     * @covers Zend\Db\Sql\Ddl\Column\Column::getOptions
     * @depends testSetOptions
     */
    public function testGetOptions(Column $column)
    {
        $this->assertEquals(array('autoincrement' => true), $column->getOptions());
    }

    /**
     * @covers Zend\Db\Sql\Ddl\Column\Column::getExpressionData
     */
    public function testGetExpressionData()
    {
        $column = new Column;
        $column->setName('foo');
        $this->assertEquals(
            array(array('%s %s', array('foo', 'INTEGER NOT NULL'), array($column::TYPE_IDENTIFIER, $column::TYPE_LITERAL))),
            $column->getExpressionData()
        );

        $column->setNullable(true);
        $this->assertEquals(
            array(array('%s %s', array('foo', 'INTEGER'), array($column::TYPE_IDENTIFIER, $column::TYPE_LITERAL))),
            $column->getExpressionData()
        );

        $column->setDefault('bar');
        $this->assertEquals(
            array(array('%s %s DEFAULT %s', array('foo', 'INTEGER', 'bar'), array($column::TYPE_IDENTIFIER, $column::TYPE_LITERAL, $column::TYPE_VALUE))),
            $column->getExpressionData()
        );
    }
}
