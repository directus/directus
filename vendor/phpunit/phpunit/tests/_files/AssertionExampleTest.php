<?php
class AssertionExampleTest extends PHPUnit_Framework_TestCase
{
    public function testOne()
    {
        $e = new AssertionExample;

        $e->doSomething();
    }
}
