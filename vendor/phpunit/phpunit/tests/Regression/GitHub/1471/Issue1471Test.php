<?php
class Issue1471Test extends PHPUnit_Framework_TestCase
{
    public function testFailure()
    {
        $this->expectOutputString('*');

        print '*';

        $this->assertTrue(false);
    }
}
