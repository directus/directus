<?php

use Directus\Util\Formatting;

class FormattingTest extends PHPUnit_Framework_TestCase
{
    public function testFilenameToTitle()
    {
        $path = __DIR__ . '/a-test_file.txt';
        $this->assertEquals('A Test File', Formatting::fileNameToFileTitle($path));
    }

    public function testUnderscoreToCamelCase()
    {
        $this->assertEquals('HelloWorld', Formatting::underscoreToCamelCase('hello_world'));
    }

    public function testSanitizeTitle()
    {
        /*
        $title = 'this is a text example';
        $this->assertEquals('this-is-a-text-example', Formatting::sanitize_title_with_dashes($title));

        $title = 'this–is—a text example';
        $this->assertEquals('this-is-a-text-example', Formatting::sanitize_title_with_dashes($title, '', 'save'));
        */
    }
}
