<?php

class FatalTest extends PHPUnit_Framework_TestCase
{
    public function testFatalError()
    {
        if (extension_loaded('xdebug')) {
            xdebug_disable();
        }

        eval('class FatalTest {}');
    }
}
