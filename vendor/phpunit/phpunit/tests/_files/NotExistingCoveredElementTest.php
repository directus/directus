<?php
class NotExistingCoveredElementTest extends PHPUnit_Framework_TestCase
{
    /**
     * @covers NotExistingClass
     */
    public function testOne()
    {
    }

    /**
     * @covers NotExistingClass::notExistingMethod
     */
    public function testTwo()
    {
    }

    /**
     * @covers NotExistingClass::<public>
     */
    public function testThree()
    {
    }
}
