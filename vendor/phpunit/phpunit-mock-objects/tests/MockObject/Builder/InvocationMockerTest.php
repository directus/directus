<?php
class Framework_MockObject_Builder_InvocationMockerTest extends PHPUnit_Framework_TestCase
{
    public function testWillReturnWithOneValue()
    {
        $mock = $this->getMockBuilder(stdClass::class)
                     ->setMethods(['foo'])
                     ->getMock();

        $mock->expects($this->any())
             ->method('foo')
             ->willReturn(1);

        $this->assertEquals(1, $mock->foo());
    }

    public function testWillReturnWithMultipleValues()
    {
        $mock = $this->getMockBuilder(stdClass::class)
                     ->setMethods(['foo'])
                     ->getMock();

        $mock->expects($this->any())
             ->method('foo')
             ->willReturn(1, 2, 3);

        $this->assertEquals(1, $mock->foo());
        $this->assertEquals(2, $mock->foo());
        $this->assertEquals(3, $mock->foo());
    }

    public function testWillReturnOnConsecutiveCalls()
    {
        $mock = $this->getMockBuilder(stdClass::class)
                     ->setMethods(['foo'])
                     ->getMock();

        $mock->expects($this->any())
             ->method('foo')
             ->willReturnOnConsecutiveCalls(1, 2, 3);

        $this->assertEquals(1, $mock->foo());
        $this->assertEquals(2, $mock->foo());
        $this->assertEquals(3, $mock->foo());
    }

    public function testWillReturnByReference()
    {
        $mock = $this->getMockBuilder(stdClass::class)
                     ->setMethods(['foo'])
                     ->getMock();

        $mock->expects($this->any())
             ->method('foo')
             ->willReturnReference($value);

        $this->assertSame(null, $mock->foo());
        $value = 'foo';
        $this->assertSame('foo', $mock->foo());
        $value = 'bar';
        $this->assertSame('bar', $mock->foo());
    }
}
