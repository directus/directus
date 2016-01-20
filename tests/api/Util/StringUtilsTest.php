<?php

use Directus\Util\StringUtils;

class StringUtilsTest extends PHPUnit_Framework_TestCase
{
    public function testStartsWith()
    {
        $string = 'john_mcclane';
        $this->assertTrue(StringUtils::startsWith($string, 'john'));
        $this->assertFalse(StringUtils::startsWith($string, 'mcclane'));
    }

    public function testEndsWith()
    {
        $string = 'john_marston';
        $this->assertTrue(StringUtils::endsWith($string, 'marston'));
        $this->assertFalse(StringUtils::endsWith($string, 'john'));
    }
}
