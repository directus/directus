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

    public function testLength()
    {
        $this->assertEquals(10, StringUtils::length('mr. falcon'));
    }

    public function testRandom()
    {
        $length = 10;
        $this->assertEquals(10, strlen(StringUtils::random($length)));
        $this->assertEquals(16, strlen(StringUtils::random()));
        $this->assertInternalType('string', StringUtils::random());
        $this->assertEquals(1, strlen(StringUtils::random(1)));
    }

    /**
     * @expectedException     InvalidArgumentException
     */
    public function testRandomHasException()
    {
        StringUtils::random(0);
    }

    public function testUnderscoreToCamelCase()
    {
        $this->assertSame('camelCase', StringUtils::underscoreToCamelCase('camel_case'));
        $this->assertSame('CamelCase', StringUtils::underscoreToCamelCase('camel_case', true));
    }

    public function testToCamelCase()
    {
        $this->assertSame('camelCase', StringUtils::toCamelCase('camel_case'));
        $this->assertSame('CamelCase', StringUtils::toCamelCase('camel_case', true));

        $this->assertSame('camelCase', StringUtils::toCamelCase('camel-case', false, '-'));
        $this->assertSame('CamelCase', StringUtils::toCamelCase('camel-case', true, '-'));
    }
}
