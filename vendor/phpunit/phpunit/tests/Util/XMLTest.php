<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Util_XMLTest extends PHPUnit_Framework_TestCase
{
    /**
     * @dataProvider charProvider
     */
    public function testPrepareString($char)
    {
        $e = null;

        $escapedString = PHPUnit_Util_XML::prepareString($char);
        $xml           = "<?xml version='1.0' encoding='UTF-8' ?><tag>$escapedString</tag>";
        $dom           = new DomDocument('1.0', 'UTF-8');

        try {
            $dom->loadXML($xml);
        } catch (Exception $e) {
        }

        $this->assertNull($e, sprintf(
            'PHPUnit_Util_XML::prepareString("\x%02x") should not crash DomDocument',
            ord($char)
        ));
    }

    public function charProvider()
    {
        $data = [];

        for ($i = 0; $i < 256; $i++) {
            $data[] = [chr($i)];
        }

        return $data;
    }

    /**
     * @expectedException PHPUnit_Framework_Exception
     * @expectedExceptionMessage Could not load XML from empty string
     */
    public function testLoadEmptyString()
    {
        PHPUnit_Util_XML::load('');
    }

    /**
     * @expectedException PHPUnit_Framework_Exception
     * @expectedExceptionMessage Could not load XML from array
     */
    public function testLoadArray()
    {
        PHPUnit_Util_XML::load([1, 2, 3]);
    }

    /**
     * @expectedException PHPUnit_Framework_Exception
     * @expectedExceptionMessage Could not load XML from boolean
     */
    public function testLoadBoolean()
    {
        PHPUnit_Util_XML::load(false);
    }

    public function testNestedXmlToVariable()
    {
        $xml = '<array><element key="a"><array><element key="b"><string>foo</string></element></array></element><element key="c"><string>bar</string></element></array>';
        $dom = new DOMDocument();
        $dom->loadXML($xml);

        $expected = [
            'a' => [
                'b' => 'foo',
            ],
            'c' => 'bar',
        ];

        $actual = PHPUnit_Util_XML::xmlToVariable($dom->documentElement);

        $this->assertSame($expected, $actual);
    }
}
