<?php
class StopOnWarningTestSuite
{
    public static function suite()
    {
        $suite = new PHPUnit_Framework_TestSuite('Test Warnings');

        $suite->addTestSuite('NoTestCases');
        $suite->addTestSuite('CoverageClassTest');

        return $suite;
    }
}
