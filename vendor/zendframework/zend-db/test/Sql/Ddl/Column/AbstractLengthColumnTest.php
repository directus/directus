<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Ddl\Column;

class AbstractLengthColumnTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @covers Zend\Db\Sql\Ddl\Column\AbstractLengthColumn::setLength
     */
    public function testSetLength()
    {
        $column = $this->getMockForAbstractClass('Zend\Db\Sql\Ddl\Column\AbstractLengthColumn', [
            'foo', 55
        ]);
        $this->assertEquals(55, $column->getLength());
        $this->assertSame($column, $column->setLength(20));
        $this->assertEquals(20, $column->getLength());
    }

    /**
     * @covers Zend\Db\Sql\Ddl\Column\AbstractLengthColumn::getLength
     */
    public function testGetLength()
    {
        $column = $this->getMockForAbstractClass('Zend\Db\Sql\Ddl\Column\AbstractLengthColumn', [
            'foo', 55
        ]);
        $this->assertEquals(55, $column->getLength());
    }

    /**
     * @covers Zend\Db\Sql\Ddl\Column\AbstractLengthColumn::getExpressionData
     */
    public function testGetExpressionData()
    {
        $column = $this->getMockForAbstractClass('Zend\Db\Sql\Ddl\Column\AbstractLengthColumn', [
            'foo', 4
        ]);

        $this->assertEquals(
            [['%s %s NOT NULL', ['foo', 'INTEGER(4)'], [$column::TYPE_IDENTIFIER, $column::TYPE_LITERAL]]],
            $column->getExpressionData()
        );
    }
}
