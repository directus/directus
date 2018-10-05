<?php
class Issue433Test extends PHPUnit_Framework_TestCase
{
    public function testOutputWithExpectationBefore()
    {
        $this->expectOutputString('test');
        print 'test';
    }

    public function testOutputWithExpectationAfter()
    {
        print 'test';
        $this->expectOutputString('test');
    }

    public function testNotMatchingOutput()
    {
        print 'bar';
        $this->expectOutputString('foo');
    }
}
