<?php
class Issue1337Test extends PHPUnit_Framework_TestCase
{
    /**
     * @dataProvider dataProvider
     */
    public function testProvider($a)
    {
        $this->assertTrue($a);
    }

    public function dataProvider()
    {
        return [
          'c:\\'=> [true],
          0.9   => [true]
        ];
    }
}
