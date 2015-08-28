<?php

use Directus\Util\Formatting;

class FormattingTest extends PHPUnit_Framework_TestCase
{
    public function testUnderscoreToCamelCase()
    {
        $this->assertEquals(Formatting::underscoreToCamelCase('hello_world'), 'HelloWorld');
    }
}