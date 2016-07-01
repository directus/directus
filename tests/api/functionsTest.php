<?php

class FunctionsTest extends PHPUnit_Framework_TestCase
{
    public function testSpecialCaps()
    {
        $text = 'I want an ipad, ipod and iphone with the latest ios';
        $expected = 'I Want An iPad, iPod And iPhone With The Latest iOS';
        $this->assertSame($expected, uc_convert($text));
    }
}
