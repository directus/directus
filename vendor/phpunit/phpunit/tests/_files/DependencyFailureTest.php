<?php
class DependencyFailureTest extends PHPUnit_Framework_TestCase
{
    public function testOne()
    {
        $this->fail();
    }

    /**
     * @depends testOne
     */
    public function testTwo()
    {
    }

    /**
     * @depends !clone testTwo
     */
    public function testThree()
    {
    }

    /**
     * @depends clone testOne
     */
    public function testFour()
    {
    }
}
