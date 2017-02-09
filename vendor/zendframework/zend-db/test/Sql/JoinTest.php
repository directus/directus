<?php
/**
 * @link      http://github.com/zendframework/zend-db for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql;

use PHPUnit_Framework_TestCase as TestCase;
use Zend\Db\Sql\Join;

class JoinTest extends TestCase
{
    /**
     * @testdox unit test: Test join() returns Join object (is chainable)
     * @covers Zend\Db\Sql\Join::join
     */
    public function testJoin()
    {
        $join = new Join;
        $return = $join->join('baz', 'foo.fooId = baz.fooId', Join::JOIN_LEFT);
        $this->assertSame($join, $return);
    }

    /**
     * @testdox unit test: Test count() returns correct count
     * @covers Zend\Db\Sql\Join::count
     * @covers Zend\Db\Sql\Join::join
     */
    public function testCount()
    {
        $join = new Join;
        $join->join('baz', 'foo.fooId = baz.fooId', Join::JOIN_LEFT);
        $join->join('bar', 'foo.fooId = bar.fooId', Join::JOIN_LEFT);

        $this->assertEquals(2, $join->count());
        $this->assertEquals(count($join->getJoins()), $join->count());
    }

    /**
     * @testdox unit test: Test reset() resets the joins
     * @covers Zend\Db\Sql\Join::count
     * @covers Zend\Db\Sql\Join::join
     * @covers Zend\Db\Sql\Join::reset
     */
    public function testReset()
    {
        $join = new Join;
        $join->join('baz', 'foo.fooId = baz.fooId', Join::JOIN_LEFT);
        $join->join('bar', 'foo.fooId = bar.fooId', Join::JOIN_LEFT);
        $join->reset();

        $this->assertEquals(0, $join->count());
    }
}
