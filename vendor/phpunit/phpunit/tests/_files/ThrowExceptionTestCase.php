<?php
class ThrowExceptionTestCase extends PHPUnit_Framework_TestCase
{
    public function test()
    {
        throw new RuntimeException('A runtime error occurred');
    }
}
