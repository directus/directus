<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\ResultSet;

class AbstractResultSetTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @var \PHPUnit_Framework_MockObject_MockObject
     */
    protected $resultSet;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        $this->resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
    }

    /**
     * @covers Zend\Db\ResultSet\AbstractResultSet::initialize
     */
    public function testInitialize()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');

        $this->assertSame($resultSet, $resultSet->initialize(array(
            array('id' => 1, 'name' => 'one'),
            array('id' => 2, 'name' => 'two'),
            array('id' => 3, 'name' => 'three'),
        )));

        $this->setExpectedException(
            'Zend\Db\ResultSet\Exception\InvalidArgumentException',
            'DataSource provided is not an array, nor does it implement Iterator or IteratorAggregate'
        );
        $resultSet->initialize('foo');
    }

    /**
     * @covers Zend\Db\ResultSet\AbstractResultSet::buffer
     */
    public function testBuffer()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $this->assertSame($resultSet, $resultSet->buffer());

        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $resultSet->initialize(new \ArrayIterator(array(
                array('id' => 1, 'name' => 'one'),
                array('id' => 2, 'name' => 'two'),
                array('id' => 3, 'name' => 'three'),
        )));
        $resultSet->next(); // start iterator
        $this->setExpectedException(
            'Zend\Db\ResultSet\Exception\RuntimeException',
            'Buffering must be enabled before iteration is started'
        );
        $resultSet->buffer();
    }

    /**
     * @covers Zend\Db\ResultSet\AbstractResultSet::isBuffered
     */
    public function testIsBuffered()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $this->assertFalse($resultSet->isBuffered());
        $resultSet->buffer();
        $this->assertTrue($resultSet->isBuffered());
    }

    /**
     * @covers Zend\Db\ResultSet\AbstractResultSet::getDataSource
     */
    public function testGetDataSource()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $resultSet->initialize(new \ArrayIterator(array(
            array('id' => 1, 'name' => 'one'),
            array('id' => 2, 'name' => 'two'),
            array('id' => 3, 'name' => 'three'),
        )));
        $this->assertInstanceOf('\ArrayIterator', $resultSet->getDataSource());
    }

    /**
     * @covers Zend\Db\ResultSet\AbstractResultSet::getFieldCount
     */
    public function testGetFieldCount()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $resultSet->initialize(new \ArrayIterator(array(
            array('id' => 1, 'name' => 'one'),
        )));
        $this->assertEquals(2, $resultSet->getFieldCount());
    }

    /**
     * @covers Zend\Db\ResultSet\AbstractResultSet::next
     */
    public function testNext()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $resultSet->initialize(new \ArrayIterator(array(
            array('id' => 1, 'name' => 'one'),
            array('id' => 2, 'name' => 'two'),
            array('id' => 3, 'name' => 'three'),
        )));
        $this->assertNull($resultSet->next());
    }

    /**
     * @covers Zend\Db\ResultSet\AbstractResultSet::key
     */
    public function testKey()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $resultSet->initialize(new \ArrayIterator(array(
            array('id' => 1, 'name' => 'one'),
            array('id' => 2, 'name' => 'two'),
            array('id' => 3, 'name' => 'three'),
        )));
        $resultSet->next();
        $this->assertEquals(1, $resultSet->key());
        $resultSet->next();
        $this->assertEquals(2, $resultSet->key());
        $resultSet->next();
        $this->assertEquals(3, $resultSet->key());
    }

    /**
     * @covers Zend\Db\ResultSet\AbstractResultSet::current
     */
    public function testCurrent()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $resultSet->initialize(new \ArrayIterator(array(
            array('id' => 1, 'name' => 'one'),
            array('id' => 2, 'name' => 'two'),
            array('id' => 3, 'name' => 'three'),
        )));
        $this->assertEquals(array('id' => 1, 'name' => 'one'), $resultSet->current());
    }

    /**
     * @covers Zend\Db\ResultSet\AbstractResultSet::valid
     */
    public function testValid()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $resultSet->initialize(new \ArrayIterator(array(
            array('id' => 1, 'name' => 'one'),
            array('id' => 2, 'name' => 'two'),
            array('id' => 3, 'name' => 'three'),
        )));
        $this->assertTrue($resultSet->valid());
        $resultSet->next(); $resultSet->next(); $resultSet->next();
        $this->assertFalse($resultSet->valid());
    }

    /**
     * @covers Zend\Db\ResultSet\AbstractResultSet::rewind
     */
    public function testRewind()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $resultSet->initialize(new \ArrayIterator(array(
            array('id' => 1, 'name' => 'one'),
            array('id' => 2, 'name' => 'two'),
            array('id' => 3, 'name' => 'three'),
        )));
        $this->assertNull($resultSet->rewind());
    }

    /**
     * @covers Zend\Db\ResultSet\AbstractResultSet::count
     */
    public function testCount()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $resultSet->initialize(new \ArrayIterator(array(
            array('id' => 1, 'name' => 'one'),
            array('id' => 2, 'name' => 'two'),
            array('id' => 3, 'name' => 'three'),
        )));
        $this->assertEquals(3, $resultSet->count());
    }

    /**
     * @covers Zend\Db\ResultSet\AbstractResultSet::toArray
     */
    public function testToArray()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $resultSet->initialize(new \ArrayIterator(array(
            array('id' => 1, 'name' => 'one'),
            array('id' => 2, 'name' => 'two'),
            array('id' => 3, 'name' => 'three'),
        )));
        $this->assertEquals(
            array(
                array('id' => 1, 'name' => 'one'),
                array('id' => 2, 'name' => 'two'),
                array('id' => 3, 'name' => 'three'),
            ),
            $resultSet->toArray()
        );
    }
}
