<?php
class Issue1149Test extends PHPUnit_Framework_TestCase
{
    public function testOne()
    {
        $this->assertTrue(true);
        print '1';
    }

    /**
     * @runInSeparateProcess
     */
    public function testTwo()
    {
        $this->assertTrue(true);
        print '2';
    }
}
