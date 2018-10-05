<?php
class CoverageClassTest extends PHPUnit_Framework_TestCase
{
    /**
     * @covers CoveredClass
     */
    public function testSomething()
    {
        $o = new CoveredClass;
        $o->publicMethod();
    }
}
