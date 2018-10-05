<?php
class CoverageMethodParenthesesTest extends PHPUnit_Framework_TestCase
{
    /**
     * @covers CoveredClass::publicMethod()
     */
    public function testSomething()
    {
        $o = new CoveredClass;
        $o->publicMethod();
    }
}
