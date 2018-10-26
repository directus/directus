<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\Pdo;

use PHPUnit\Framework\TestCase;
use stdClass;
use Zend\Db\Adapter\Driver\Pdo\Result;

/**
 * Class ResultTest
 * @package ZendTest\Db\Adapter\Driver\Pdo
 *
 * @group result-pdo
 */
class ResultTest extends TestCase
{

    /**
     * Tests current method returns same data on consecutive calls.
     *
     * @covers \Zend\Db\Adapter\Driver\Pdo\Result::current
     */
    public function testCurrent()
    {
        $stub = $this->getMockBuilder('PDOStatement')->getMock();
        $stub->expects($this->any())
            ->method('fetch')
            ->will($this->returnCallback(function () {
                return uniqid();
            }));

        $result = new Result();
        $result->initialize($stub, null);

        self::assertEquals($result->current(), $result->current());
    }

    public function testFetchModeException()
    {
        $result = new Result();

        $this->expectException('\Zend\Db\Adapter\Exception\InvalidArgumentException');
        $result->setFetchMode(11);
    }

    /**
     * Tests whether the fetch mode was set properly and
     */
    public function testFetchModeAnonymousObject()
    {
        $stub = $this->getMockBuilder('PDOStatement')->getMock();
        $stub->expects($this->any())
            ->method('fetch')
            ->will($this->returnCallback(function () {
                return new stdClass;
            }));

        $result = new Result();
        $result->initialize($stub, null);
        $result->setFetchMode(\PDO::FETCH_OBJ);

        self::assertEquals(5, $result->getFetchMode());
        self::assertInstanceOf('stdClass', $result->current());
    }
}
