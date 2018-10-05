<?php
class NotPublicTestCase extends PHPUnit_Framework_TestCase
{
    public function testPublic()
    {
    }

    protected function testNotPublic()
    {
    }
}
