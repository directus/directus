<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\Oci8;

use PHPUnit\Framework\TestCase;
use Zend\Db\Adapter\Driver\Oci8\Result;

/**
 * Class ResultTest
 *
 * @package ZendTest\Db\Adapter\Driver\Oci8
 * @group result-oci8
 */
class ResultTest extends TestCase
{
    /**
     * @covers \Zend\Db\Adapter\Driver\Oci8\Result::getResource
     */
    public function testGetResource()
    {
        $result = new Result();
        self::assertNull($result->getResource());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Oci8\Result::buffer
     */
    public function testBuffer()
    {
        $result = new Result();
        self::assertNull($result->buffer());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Oci8\Result::isBuffered
     */
    public function testIsBuffered()
    {
        $result = new Result();
        self::assertFalse($result->isBuffered());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Oci8\Result::getGeneratedValue
     */
    public function testGetGeneratedValue()
    {
        $result = new Result();
        self::assertNull($result->getGeneratedValue());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Oci8\Result::key
     */
    public function testKey()
    {
        $result = new Result();
        self::assertEquals(0, $result->key());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Oci8\Result::next
     */
    public function testNext()
    {
        $mockResult = $this->getMockBuilder('Zend\Db\Adapter\Driver\Oci8\Result')
            ->setMethods(['loadData'])
            ->getMock();
        $mockResult->expects($this->any())
            ->method('loadData')
            ->will($this->returnValue(true));
        self::assertTrue($mockResult->next());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Oci8\Result::rewind
     */
    public function testRewind()
    {
        $result = new Result();
        self::assertNull($result->rewind());
    }
}
