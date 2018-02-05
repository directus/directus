<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\ResultSet;

use PHPUnit\Framework\TestCase;

class AbstractResultSetTest extends TestCase
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
     * @covers \Zend\Db\ResultSet\AbstractResultSet::initialize
     */
    public function testInitialize()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');

        self::assertSame($resultSet, $resultSet->initialize([
            ['id' => 1, 'name' => 'one'],
            ['id' => 2, 'name' => 'two'],
            ['id' => 3, 'name' => 'three'],
        ]));

        $this->expectException('Zend\Db\ResultSet\Exception\InvalidArgumentException');
        $this->expectExceptionMessage(
            'DataSource provided is not an array, nor does it implement Iterator or IteratorAggregate'
        );
        $resultSet->initialize('foo');
    }

    /**
     * @covers \Zend\Db\ResultSet\AbstractResultSet::initialize
     */
    public function testInitializeDoesNotCallCount()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $result = $this->getMockForAbstractClass('Zend\Db\Adapter\Driver\ResultInterface');
        $result->expects($this->never())->method('count');
        $resultSet->initialize($result);
    }

    /**
     * @covers \Zend\Db\ResultSet\AbstractResultSet::buffer
     */
    public function testBuffer()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        self::assertSame($resultSet, $resultSet->buffer());

        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $resultSet->initialize(new \ArrayIterator([
                ['id' => 1, 'name' => 'one'],
                ['id' => 2, 'name' => 'two'],
                ['id' => 3, 'name' => 'three'],
        ]));
        $resultSet->next(); // start iterator
        $this->expectException('Zend\Db\ResultSet\Exception\RuntimeException');
        $this->expectExceptionMessage('Buffering must be enabled before iteration is started');
        $resultSet->buffer();
    }

    /**
     * @covers \Zend\Db\ResultSet\AbstractResultSet::isBuffered
     */
    public function testIsBuffered()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        self::assertFalse($resultSet->isBuffered());
        $resultSet->buffer();
        self::assertTrue($resultSet->isBuffered());
    }

    /**
     * @covers \Zend\Db\ResultSet\AbstractResultSet::getDataSource
     */
    public function testGetDataSource()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $resultSet->initialize(new \ArrayIterator([
            ['id' => 1, 'name' => 'one'],
            ['id' => 2, 'name' => 'two'],
            ['id' => 3, 'name' => 'three'],
        ]));
        self::assertInstanceOf('\ArrayIterator', $resultSet->getDataSource());
    }

    /**
     * @covers \Zend\Db\ResultSet\AbstractResultSet::getFieldCount
     */
    public function testGetFieldCount()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $resultSet->initialize(new \ArrayIterator([
            ['id' => 1, 'name' => 'one'],
        ]));
        self::assertEquals(2, $resultSet->getFieldCount());
    }

    /**
     * @covers \Zend\Db\ResultSet\AbstractResultSet::next
     */
    public function testNext()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $resultSet->initialize(new \ArrayIterator([
            ['id' => 1, 'name' => 'one'],
            ['id' => 2, 'name' => 'two'],
            ['id' => 3, 'name' => 'three'],
        ]));
        self::assertNull($resultSet->next());
    }

    /**
     * @covers \Zend\Db\ResultSet\AbstractResultSet::key
     */
    public function testKey()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $resultSet->initialize(new \ArrayIterator([
            ['id' => 1, 'name' => 'one'],
            ['id' => 2, 'name' => 'two'],
            ['id' => 3, 'name' => 'three'],
        ]));
        $resultSet->next();
        self::assertEquals(1, $resultSet->key());
        $resultSet->next();
        self::assertEquals(2, $resultSet->key());
        $resultSet->next();
        self::assertEquals(3, $resultSet->key());
    }

    /**
     * @covers \Zend\Db\ResultSet\AbstractResultSet::current
     */
    public function testCurrent()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $resultSet->initialize(new \ArrayIterator([
            ['id' => 1, 'name' => 'one'],
            ['id' => 2, 'name' => 'two'],
            ['id' => 3, 'name' => 'three'],
        ]));
        self::assertEquals(['id' => 1, 'name' => 'one'], $resultSet->current());
    }

    /**
     * @covers \Zend\Db\ResultSet\AbstractResultSet::valid
     */
    public function testValid()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $resultSet->initialize(new \ArrayIterator([
            ['id' => 1, 'name' => 'one'],
            ['id' => 2, 'name' => 'two'],
            ['id' => 3, 'name' => 'three'],
        ]));
        self::assertTrue($resultSet->valid());
        $resultSet->next();
        $resultSet->next();
        $resultSet->next();
        self::assertFalse($resultSet->valid());
    }

    /**
     * @covers \Zend\Db\ResultSet\AbstractResultSet::rewind
     */
    public function testRewind()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $resultSet->initialize(new \ArrayIterator([
            ['id' => 1, 'name' => 'one'],
            ['id' => 2, 'name' => 'two'],
            ['id' => 3, 'name' => 'three'],
        ]));
        self::assertNull($resultSet->rewind());
    }

    /**
     * @covers \Zend\Db\ResultSet\AbstractResultSet::count
     */
    public function testCount()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $resultSet->initialize(new \ArrayIterator([
            ['id' => 1, 'name' => 'one'],
            ['id' => 2, 'name' => 'two'],
            ['id' => 3, 'name' => 'three'],
        ]));
        self::assertEquals(3, $resultSet->count());
    }

    /**
     * @covers \Zend\Db\ResultSet\AbstractResultSet::toArray
     */
    public function testToArray()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $resultSet->initialize(new \ArrayIterator([
            ['id' => 1, 'name' => 'one'],
            ['id' => 2, 'name' => 'two'],
            ['id' => 3, 'name' => 'three'],
        ]));
        self::assertEquals(
            [
                ['id' => 1, 'name' => 'one'],
                ['id' => 2, 'name' => 'two'],
                ['id' => 3, 'name' => 'three'],
            ],
            $resultSet->toArray()
        );
    }

    /**
     * Test multiple iterations with buffer
     * @group issue-6845
     */
    public function testBufferIterations()
    {
        $resultSet = $this->getMockForAbstractClass('Zend\Db\ResultSet\AbstractResultSet');
        $resultSet->initialize(new \ArrayIterator([
            ['id' => 1, 'name' => 'one'],
            ['id' => 2, 'name' => 'two'],
            ['id' => 3, 'name' => 'three'],
        ]));
        $resultSet->buffer();

        $data = $resultSet->current();
        self::assertEquals(1, $data['id']);
        $resultSet->next();
        $data = $resultSet->current();
        self::assertEquals(2, $data['id']);

        $resultSet->rewind();
        $data = $resultSet->current();
        self::assertEquals(1, $data['id']);
        $resultSet->next();
        $data = $resultSet->current();
        self::assertEquals(2, $data['id']);
        $resultSet->next();
        $data = $resultSet->current();
        self::assertEquals(3, $data['id']);
    }
}
