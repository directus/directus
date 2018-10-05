<?php
class CoverageNamespacedFunctionTest extends PHPUnit_Framework_TestCase
{
    /**
     * @covers foo\func()
     */
    public function testFunc()
    {
        foo\func();
    }
}
