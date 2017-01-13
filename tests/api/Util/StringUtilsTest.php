<?php

use Directus\Util\StringUtils;

class StringUtilsTest extends PHPUnit_Framework_TestCase
{
    public function testContains()
    {
        $this->assertTrue(StringUtils::contains('I am learning the abc', 'abc'));
        $this->assertFalse(StringUtils::contains('I am John', 'Jack'));

        $this->assertTrue(StringUtils::contains('JavaScript, Java, PHP, C', ['Java', 'C']));
        $this->assertFalse(StringUtils::contains('JavaScript, Java, PHP, C', ['C#', 'C++']));
    }

    public function testHas()
    {
        $this->assertTrue(StringUtils::has('I am learning the abc', 'abc'));
        $this->assertFalse(StringUtils::has('I am John', 'Jack'));

        $this->assertTrue(StringUtils::has('JavaScript, Java, PHP, C', ['Java', 'C']));
        $this->assertFalse(StringUtils::has('JavaScript, Java, PHP, C', ['C#', 'C++']));
    }

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

        if (!function_exists('random_bytes')) {
            function random_bytes($length)
            {
                if ($length == 99) {
                    throw new \Exception('Random exception');
                }

                return str_repeat('a', $length);
            }
        }

        $this->assertEquals(10, strlen(StringUtils::random($length)));
        $this->assertEquals(99, strlen(StringUtils::random(99)));
    }

    public function testRandomString()
    {
        $length = 10;
        $this->assertEquals(10, strlen(StringUtils::randomString($length)));
        $this->assertEquals(16, strlen(StringUtils::randomString()));
        $this->assertInternalType('string', StringUtils::randomString());
        $this->assertEquals(1, strlen(StringUtils::randomString(1)));
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

    public function testCharSequence()
    {
        $this->assertSame('a', StringUtils::charSequence());
        $this->assertSame('b', StringUtils::charSequence('a'));
        $this->assertSame('aa', StringUtils::charSequence('z'));
        $this->assertSame('ab', StringUtils::charSequence('aa'));
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

        $string = 'Paid: {{true}},  overdue: {{false}}.';
        $data = ['true' => true, 'false' => false];
        $expected = 'Paid: true,  overdue: false.';
        $this->assertEquals($expected, StringUtils::replacePlaceholder($string, $data, StringUtils::PLACEHOLDER_DOUBLE_MUSTACHE));
    }

    public function testCsv()
    {
        $csv = 'one, two, , three,four';

        // trim string
        $result = StringUtils::csv($csv);
        $this->assertInternalType('array', $result);
        $this->assertCount(5, $result);
        $this->assertSame('two', $result[1]);

        // without trim
        $result = StringUtils::csv($csv, false);
        $this->assertInternalType('array', $result);
        $this->assertCount(5, $result);
        $this->assertSame(' two', $result[1]);
    }

    /**
     * @expectedException \InvalidArgumentException
     */
    public function testCsvException()
    {
        $result = StringUtils::csv(['one', 'two']);
    }
}
