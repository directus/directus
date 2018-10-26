<?php
class Framework_MockObject_Matcher_ConsecutiveParametersTest extends PHPUnit_Framework_TestCase
{
    public function testIntegration()
    {
        $mock = $this->getMockBuilder(stdClass::class)
                     ->setMethods(['foo'])
                     ->getMock();

        $mock->expects($this->any())
             ->method('foo')
             ->withConsecutive(
                 ['bar'],
                 [21, 42]
             );

        $this->assertNull($mock->foo('bar'));
        $this->assertNull($mock->foo(21, 42));
    }

    public function testIntegrationWithLessAssertionsThanMethodCalls()
    {
        $mock = $this->getMockBuilder(stdClass::class)
                     ->setMethods(['foo'])
                     ->getMock();

        $mock->expects($this->any())
             ->method('foo')
             ->withConsecutive(
                 ['bar']
             );

        $this->assertNull($mock->foo('bar'));
        $this->assertNull($mock->foo(21, 42));
    }

    public function testIntegrationExpectingException()
    {
        $mock = $this->getMockBuilder(stdClass::class)
                     ->setMethods(['foo'])
                     ->getMock();

        $mock->expects($this->any())
             ->method('foo')
             ->withConsecutive(
                 ['bar'],
                 [21, 42]
             );

        $mock->foo('bar');

        $this->expectException(PHPUnit_Framework_ExpectationFailedException::class);

        $mock->foo('invalid');
    }
}
