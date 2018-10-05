<?php
class CoverageFunctionParenthesesWhitespaceTest extends PHPUnit_Framework_TestCase
{
    /**
     * @covers ::globalFunction ( )
     */
    public function testSomething()
    {
        globalFunction();
    }
}
