<?php
require_once 'OneTest.php';
require_once 'TwoTest.php';

class ChildSuite
{
    public static function suite()
    {
        $suite = new PHPUnit_Framework_TestSuite('Child');
        $suite->addTestSuite('OneTest');
        $suite->addTestSuite('TwoTest');

        return $suite;
    }
}
