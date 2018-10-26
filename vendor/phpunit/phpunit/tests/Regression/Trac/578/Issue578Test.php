<?php
class Issue578Test extends PHPUnit_Framework_TestCase
{
    public function testNoticesDoublePrintStackTrace()
    {
        $this->iniSet('error_reporting', E_ALL | E_NOTICE);
        trigger_error('Stack Trace Test Notice', E_NOTICE);
    }

    public function testWarningsDoublePrintStackTrace()
    {
        $this->iniSet('error_reporting', E_ALL | E_NOTICE);
        trigger_error('Stack Trace Test Notice', E_WARNING);
    }

    public function testUnexpectedExceptionsPrintsCorrectly()
    {
        throw new Exception('Double printed exception');
    }
}
