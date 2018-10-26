<?php
class Issue1437Test extends PHPUnit_Framework_TestCase
{
    public function testFailure()
    {
        ob_start();
        $this->assertTrue(false);
    }
}
