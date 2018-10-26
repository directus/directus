<?php
class DependencySuccessTest extends PHPUnit_Framework_TestCase
{
    public function testOne()
    {
    }

    /**
     * @depends testOne
     */
    public function testTwo()
    {
    }

    /**
     * @depends DependencySuccessTest::testTwo
     */
    public function testThree()
    {
    }
}
