<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Ddl\Constraint;

use Zend\Db\Sql\Ddl\Constraint\AbstractConstraint;

class AbstractConstraintTest extends \PHPUnit_Framework_TestCase
{
    /** @var \Zend\Db\Sql\Ddl\Constraint\AbstractConstraint */
    protected $ac;

    public function setup()
    {
        $this->ac = $this->getMockForAbstractClass('Zend\Db\Sql\Ddl\Constraint\AbstractConstraint');
    }

    /**
     * @covers Zend\Db\Sql\Ddl\Constraint\AbstractConstraint::setColumns
     */
    public function testSetColumns()
    {
        $this->assertSame($this->ac, $this->ac->setColumns(array('foo', 'bar')));
        $this->assertEquals(array('foo', 'bar'), $this->ac->getColumns());
    }

    /**
     * @covers Zend\Db\Sql\Ddl\Constraint\AbstractConstraint::addColumn
     */
    public function testAddColumn()
    {
        $this->assertSame($this->ac, $this->ac->addColumn('foo'));
        $this->assertEquals(array('foo'), $this->ac->getColumns());
    }

    /**
     * @covers Zend\Db\Sql\Ddl\Constraint\AbstractConstraint::getColumns
     */
    public function testGetColumns()
    {
        $this->ac->setColumns(array('foo', 'bar'));
        $this->assertEquals(array('foo', 'bar'), $this->ac->getColumns());
    }
}
