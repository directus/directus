<?php
class CoverageNotPrivateTest extends PHPUnit_Framework_TestCase
{
    /**
     * @covers CoveredClass::<!private>
     */
    public function testSomething()
    {
        $o = new CoveredClass;
        $o->publicMethod();
    }
}
