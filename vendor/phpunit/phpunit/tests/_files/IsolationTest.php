<?php
class IsolationTest extends PHPUnit_Framework_TestCase
{
    public function testIsInIsolationReturnsFalse()
    {
        $this->assertFalse($this->isInIsolation());
    }

    public function testIsInIsolationReturnsTrue()
    {
        $this->assertTrue($this->isInIsolation());
    }
}
