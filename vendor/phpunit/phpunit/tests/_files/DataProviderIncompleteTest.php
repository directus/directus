<?php
class DataProviderIncompleteTest extends PHPUnit_Framework_TestCase
{
    /**
     * @dataProvider incompleteTestProviderMethod
     */
    public function testIncomplete($a, $b, $c)
    {
        $this->assertTrue(true);
    }

    /**
     * @dataProvider providerMethod
     */
    public function testAdd($a, $b, $c)
    {
        $this->assertEquals($c, $a + $b);
    }

    public function incompleteTestProviderMethod()
    {
        $this->markTestIncomplete('incomplete');

        return [
          [0, 0, 0],
          [0, 1, 1],
        ];
    }

    public static function providerMethod()
    {
        return [
          [0, 0, 0],
          [0, 1, 1],
        ];
    }
}
