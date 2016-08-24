<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\Pdo;

use Zend\Db\Adapter\Driver\Pdo\Result;

class ResultTest extends \PHPUnit_Framework_TestCase
{
    /**
     * Tests current method returns same data on consecutive calls.
     *
     * @covers Zend\Db\Adapter\Driver\Pdo\Result::current
     */
    public function testCurrent()
    {
        $stub = $this->getMock('PDOStatement');
        $stub
            ->expects($this->any())
            ->method('fetch')
            ->will($this->returnCallback(function () {return uniqid();}));

        $result = new Result();
        $result->initialize($stub, null);

        $this->assertEquals($result->current(), $result->current());
    }
}
