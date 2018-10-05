<?php
class Issue2758TestListener extends PHPUnit_Framework_BaseTestListener
{
    public function endTest(PHPUnit_Framework_Test $test, $time)
    {
        if (!$test instanceof PHPUnit_Framework_TestCase) {
            return;
        }

        $test->addToAssertionCount(1);
    }
}
