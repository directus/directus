<?php
class DataProviderTestDoxTest extends PHPUnit_Framework_TestCase
{
    /**
     * @dataProvider provider
     * @testdox Does something with
     */
    public function testOne()
    {
    }

    /**
     * @dataProvider provider
     */
    public function testDoesSomethingElseWith()
    {
    }

    public function provider()
    {
        return [
            'one' => [1],
            'two' => [2]
        ];
    }
}
