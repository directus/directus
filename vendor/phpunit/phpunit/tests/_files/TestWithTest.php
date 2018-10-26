<?php
class TestWithTest extends PHPUnit_Framework_TestCase
{
    /**
     * @testWith [0, 0, 0]
     *           [0, 1, 1]
     *           [1, 2, 3]
     *           [20, 22, 42]
     */
    public function testAdd($a, $b, $c)
    {
        $this->assertEquals($c, $a + $b);
    }

    public static function providerMethod()
    {
        return [
          [0, 0, 0],
          [0, 1, 1],
          [1, 1, 3],
          [1, 0, 1]
        ];
    }
}
