<?php
/**
 * @link      http://github.com/zendframework/zend-db for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql;

use PHPUnit\Framework\TestCase;
use Zend\Db\Sql\Join;
use Zend\Db\Sql\Select;

class JoinTest extends TestCase
{
    public function testInitialPositionIsZero()
    {
        $join = new Join();

        self::assertAttributeEquals(0, 'position', $join);
    }

    public function testNextIncrementsThePosition()
    {
        $join = new Join();

        $join->next();

        self::assertAttributeEquals(1, 'position', $join);
    }

    public function testRewindResetsPositionToZero()
    {
        $join = new Join();

        $join->next();
        $join->next();
        self::assertAttributeEquals(2, 'position', $join);

        $join->rewind();
        self::assertAttributeEquals(0, 'position', $join);
    }

    public function testKeyReturnsTheCurrentPosition()
    {
        $join = new Join();

        $join->next();
        $join->next();
        $join->next();

        self::assertEquals(3, $join->key());
    }

    public function testCurrentReturnsTheCurrentJoinSpecification()
    {
        $name = 'baz';
        $on   = 'foo.id = baz.id';

        $join = new Join();
        $join->join($name, $on);

        $expectedSpecification = [
            'name'    => $name,
            'on'      => $on,
            'columns' => [Select::SQL_STAR],
            'type'    => Join::JOIN_INNER,
        ];

        self::assertEquals($expectedSpecification, $join->current());
    }

    public function testValidReturnsTrueIfTheIteratorIsAtAValidPositionAndFalseIfNot()
    {
        $join = new Join();
        $join->join('baz', 'foo.id = baz.id');

        self::assertTrue($join->valid());

        $join->next();

        self::assertFalse($join->valid());
    }

    /**
     * @testdox unit test: Test join() returns Join object (is chainable)
     * @covers \Zend\Db\Sql\Join::join
     */
    public function testJoin()
    {
        $join = new Join;
        $return = $join->join('baz', 'foo.fooId = baz.fooId', Join::JOIN_LEFT);
        self::assertSame($join, $return);
    }

    public function testJoinWillThrowAnExceptionIfNameIsNoValid()
    {
        $join = new Join();

        $this->expectException('\InvalidArgumentException');
        $this->expectExceptionMessage("join() expects '' as a single element associative array");
        $join->join([], false);
    }

    /**
     * @testdox unit test: Test count() returns correct count
     * @covers \Zend\Db\Sql\Join::count
     * @covers \Zend\Db\Sql\Join::join
     */
    public function testCount()
    {
        $join = new Join;
        $join->join('baz', 'foo.fooId = baz.fooId', Join::JOIN_LEFT);
        $join->join('bar', 'foo.fooId = bar.fooId', Join::JOIN_LEFT);

        self::assertEquals(2, $join->count());
        self::assertCount($join->count(), $join->getJoins());
    }

    /**
     * @testdox unit test: Test reset() resets the joins
     * @covers \Zend\Db\Sql\Join::count
     * @covers \Zend\Db\Sql\Join::join
     * @covers \Zend\Db\Sql\Join::reset
     */
    public function testReset()
    {
        $join = new Join;
        $join->join('baz', 'foo.fooId = baz.fooId', Join::JOIN_LEFT);
        $join->join('bar', 'foo.fooId = bar.fooId', Join::JOIN_LEFT);
        $join->reset();

        self::assertEquals(0, $join->count());
    }
}
