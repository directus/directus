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

    public function testReplacePlaceholder()
    {
        $string = 'I went to {{place}}';
        $data = ['place' => 'Portland'];
        $expected = 'I went to Portland';
        $this->assertEquals($expected, StringUtils::replacePlaceholder($string, $data));
        $this->assertEquals($expected, StringUtils::replacePlaceholder($string, $data, StringUtils::PLACEHOLDER_DOUBLE_MUSTACHE));

        $string = 'I went to %{place}';
        $this->assertEquals($expected, StringUtils::replacePlaceholder($string, $data, StringUtils::PLACEHOLDER_PERCENTAGE_MUSTACHE));

        $string = 'Took a flight from {{from_airport}} to {{to_airport}}';
        $data = ['from_airport' => 'SFO', 'to_airport' => 'PDX'];
        $expected = 'Took a flight from SFO to PDX';
        $this->assertEquals($expected, StringUtils::replacePlaceholder($string, $data));
        $this->assertEquals($expected, StringUtils::replacePlaceholder($string, $data, StringUtils::PLACEHOLDER_DOUBLE_MUSTACHE));

        $string = 'Took a flight from %{from_airport} to %{to_airport}';
        $this->assertEquals($expected, StringUtils::replacePlaceholder($string, $data, StringUtils::PLACEHOLDER_PERCENTAGE_MUSTACHE));

    }
}
