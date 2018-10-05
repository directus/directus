<?php

class BaseTestListenerSample extends PHPUnit_Framework_BaseTestListener
{
    public $endCount = 0;

    public function endTest(PHPUnit_Framework_Test $test, $time)
    {
        $this->endCount++;
    }
}
