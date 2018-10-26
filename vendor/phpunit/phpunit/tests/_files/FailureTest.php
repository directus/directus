<?php
class FailureTest extends PHPUnit_Framework_TestCase
{
    public function testAssertArrayEqualsArray()
    {
        $this->assertEquals([1], [2], 'message');
    }

    public function testAssertIntegerEqualsInteger()
    {
        $this->assertEquals(1, 2, 'message');
    }

    public function testAssertObjectEqualsObject()
    {
        $a      = new StdClass;
        $a->foo = 'bar';

        $b      = new StdClass;
        $b->bar = 'foo';

        $this->assertEquals($a, $b, 'message');
    }

    public function testAssertNullEqualsString()
    {
        $this->assertEquals(null, 'bar', 'message');
    }

    public function testAssertStringEqualsString()
    {
        $this->assertEquals('foo', 'bar', 'message');
    }

    public function testAssertTextEqualsText()
    {
        $this->assertEquals("foo\nbar\n", "foo\nbaz\n", 'message');
    }

    public function testAssertStringMatchesFormat()
    {
        $this->assertStringMatchesFormat('*%s*', '**', 'message');
    }

    public function testAssertNumericEqualsNumeric()
    {
        $this->assertEquals(1, 2, 'message');
    }

    public function testAssertTextSameText()
    {
        $this->assertSame('foo', 'bar', 'message');
    }

    public function testAssertObjectSameObject()
    {
        $this->assertSame(new StdClass, new StdClass, 'message');
    }

    public function testAssertObjectSameNull()
    {
        $this->assertSame(new StdClass, null, 'message');
    }

    public function testAssertFloatSameFloat()
    {
        $this->assertSame(1.0, 1.5, 'message');
    }

    // Note that due to the implementation of this assertion it counts as 2 asserts
    public function testAssertStringMatchesFormatFile()
    {
        $this->assertStringMatchesFormatFile(__DIR__ . '/expectedFileFormat.txt', '...BAR...');
    }
}
