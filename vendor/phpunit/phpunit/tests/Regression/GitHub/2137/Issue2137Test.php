<?php
class Issue2137Test extends PHPUnit_Framework_TestCase
{
    /**
     * @dataProvider provideBrandService
     * @param $provided
     * @param $expected
     */
    public function testBrandService($provided, $expected)
    {
        $this->assertSame($provided, $expected);
    }


    public function provideBrandService()
    {
        return [
            //[true, true]
            new stdClass() // not valid
        ];
    }


    /**
     * @dataProvider provideBrandService
     * @param $provided
     * @param $expected
     */
    public function testSomethingElseInvalid($provided, $expected)
    {
        $this->assertSame($provided, $expected);
    }
}
