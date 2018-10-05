<?php
class WasRun extends PHPUnit_Framework_TestCase
{
    public $wasRun = false;

    protected function runTest()
    {
        $this->wasRun = true;
    }
}
