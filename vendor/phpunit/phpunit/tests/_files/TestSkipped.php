<?php
class TestSkipped extends PHPUnit_Framework_TestCase
{
    protected function runTest()
    {
        $this->markTestSkipped('Skipped test');
    }
}
