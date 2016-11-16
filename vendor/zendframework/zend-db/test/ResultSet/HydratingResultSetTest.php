<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\ResultSet;

use Zend\Db\ResultSet\HydratingResultSet;

class HydratingResultSetTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @covers Zend\Db\ResultSet\HydratingResultSet::setObjectPrototype
     */
    public function testSetObjectPrototype()
    {
        $prototype = new \stdClass;
        $hydratingRs = new HydratingResultSet;
        $this->assertSame($hydratingRs, $hydratingRs->setObjectPrototype($prototype));
    }

    /**
     * @covers Zend\Db\ResultSet\HydratingResultSet::setHydrator
     */
    public function testSetHydrator()
    {
        $hydratingRs = new HydratingResultSet;
        $this->assertSame($hydratingRs, $hydratingRs->setHydrator(new \Zend\Stdlib\Hydrator\ClassMethods()));
    }

    /**
     * @covers Zend\Db\ResultSet\HydratingResultSet::getHydrator
     */
    public function testGetHydrator()
    {
        $hydratingRs = new HydratingResultSet;
        $this->assertInstanceOf('Zend\Stdlib\Hydrator\ArraySerializable', $hydratingRs->getHydrator());
    }

    /**
     * @covers Zend\Db\ResultSet\HydratingResultSet::current
     */
    public function testCurrent()
    {
        $hydratingRs = new HydratingResultSet;
        $hydratingRs->initialize(array(
            array('id' => 1, 'name' => 'one')
        ));
        $obj = $hydratingRs->current();
        $this->assertInstanceOf('ArrayObject', $obj);
    }

    /**
     * @covers Zend\Db\ResultSet\HydratingResultSet::toArray
     * @todo   Implement testToArray().
     */
    public function testToArray()
    {
        $hydratingRs = new HydratingResultSet;
        $hydratingRs->initialize(array(
            array('id' => 1, 'name' => 'one')
        ));
        $obj = $hydratingRs->toArray();
        $this->assertInternalType('array', $obj);
    }
}
