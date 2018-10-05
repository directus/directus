<?php
class Issue765Test extends PHPUnit_Framework_TestCase
{
    public function testDependee()
    {
        $this->assertTrue(true);
    }

    /**
     * @depends testDependee
     * @dataProvider dependentProvider
     */
    public function testDependent($a)
    {
        $this->assertTrue(true);
    }

    public function dependentProvider()
    {
        throw new Exception;
    }
}
