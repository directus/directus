<?php
class IniTest extends PHPUnit_Framework_TestCase
{
    public function testIni()
    {
        $this->assertEquals('application/x-test', ini_get('default_mimetype'));
    }
}
