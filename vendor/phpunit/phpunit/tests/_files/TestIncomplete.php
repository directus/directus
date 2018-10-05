<?php
class TestIncomplete extends PHPUnit_Framework_TestCase
{
    protected function runTest()
    {
        $this->markTestIncomplete('Incomplete test');
    }
}
