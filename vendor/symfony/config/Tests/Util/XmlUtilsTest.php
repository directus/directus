<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Config\Tests\Util;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Config\Util\XmlUtils;

class XmlUtilsTest extends TestCase
{
    public function testLoadFile()
    {
        $fixtures = __DIR__.'/../Fixtures/Util/';

        try {
            XmlUtils::loadFile($fixtures.'invalid.xml');
            $this->fail();
        } catch (\InvalidArgumentException $e) {
            $this->assertContains('ERROR 77', $e->getMessage());
        }

        try {
            XmlUtils::loadFile($fixtures.'document_type.xml');
            $this->fail();
        } catch (\InvalidArgumentException $e) {
            $this->assertContains('Document types are not allowed', $e->getMessage());
        }

        try {
            XmlUtils::loadFile($fixtures.'invalid_schema.xml', $fixtures.'schema.xsd');
            $this->fail();
        } catch (\InvalidArgumentException $e) {
            $this->assertContains('ERROR 1845', $e->getMessage());
        }

        try {
            XmlUtils::loadFile($fixtures.'invalid_schema.xml', 'invalid_callback_or_file');
            $this->fail();
        } catch (\InvalidArgumentException $e) {
            $this->assertContains('XSD file or callable', $e->getMessage());
        }

        $mock = $this->getMockBuilder(__NAMESPACE__.'\Validator')->getMock();
        $mock->expects($this->exactly(2))->method('validate')->will($this->onConsecutiveCalls(false, true));

        try {
            XmlUtils::loadFile($fixtures.'valid.xml', array($mock, 'validate'));
            $this->fail();
        } catch (\InvalidArgumentException $e) {
            $this->assertRegExp('/The XML file ".+" is not valid\./', $e->getMessage());
        }

        $this->assertInstanceOf('DOMDocument', XmlUtils::loadFile($fixtures.'valid.xml', array($mock, 'validate')));
        $this->assertSame(array(), libxml_get_errors());
    }

    /**
     * @expectedException \Symfony\Component\Config\Util\Exception\InvalidXmlException
     * @expectedExceptionMessage The XML is not valid
     */
    public function testParseWithInvalidValidatorCallable()
    {
        $fixtures = __DIR__.'/../Fixtures/Util/';

        $mock = $this->getMockBuilder(__NAMESPACE__.'\Validator')->getMock();
        $mock->expects($this->once())->method('validate')->willReturn(false);

        XmlUtils::parse(file_get_contents($fixtures.'valid.xml'), array($mock, 'validate'));
    }

    public function testLoadFileWithInternalErrorsEnabled()
    {
        $internalErrors = libxml_use_internal_errors(true);

        $this->assertSame(array(), libxml_get_errors());
        $this->assertInstanceOf('DOMDocument', XmlUtils::loadFile(__DIR__.'/../Fixtures/Util/invalid_schema.xml'));
        $this->assertSame(array(), libxml_get_errors());

        libxml_clear_errors();
        libxml_use_internal_errors($internalErrors);
    }

    /**
     * @dataProvider getDataForConvertDomToArray
     */
    public function testConvertDomToArray($expected, $xml, $root = false, $checkPrefix = true)
    {
        $dom = new \DOMDocument();
        $dom->loadXML($root ? $xml : '<root>'.$xml.'</root>');

        $this->assertSame($expected, XmlUtils::convertDomElementToArray($dom->documentElement, $checkPrefix));
    }

    public function getDataForConvertDomToArray()
    {
        return array(
            array(null, ''),
            array('bar', 'bar'),
            array(array('bar' => 'foobar'), '<foo bar="foobar" />', true),
            array(array('foo' => null), '<foo />'),
            array(array('foo' => 'bar'), '<foo>bar</foo>'),
            array(array('foo' => array('foo' => 'bar')), '<foo foo="bar"/>'),
            array(array('foo' => array('foo' => 0)), '<foo><foo>0</foo></foo>'),
            array(array('foo' => array('foo' => 'bar')), '<foo><foo>bar</foo></foo>'),
            array(array('foo' => array('foo' => 'bar', 'value' => 'text')), '<foo foo="bar">text</foo>'),
            array(array('foo' => array('attr' => 'bar', 'foo' => 'text')), '<foo attr="bar"><foo>text</foo></foo>'),
            array(array('foo' => array('bar', 'text')), '<foo>bar</foo><foo>text</foo>'),
            array(array('foo' => array(array('foo' => 'bar'), array('foo' => 'text'))), '<foo foo="bar"/><foo foo="text" />'),
            array(array('foo' => array('foo' => array('bar', 'text'))), '<foo foo="bar"><foo>text</foo></foo>'),
            array(array('foo' => 'bar'), '<foo><!-- Comment -->bar</foo>'),
            array(array('foo' => 'text'), '<foo xmlns:h="http://www.example.org/bar" h:bar="bar">text</foo>'),
            array(array('foo' => array('bar' => 'bar', 'value' => 'text')), '<foo xmlns:h="http://www.example.org/bar" h:bar="bar">text</foo>', false, false),
            array(array('attr' => 1, 'b' => 'hello'), '<foo:a xmlns:foo="http://www.example.org/foo" xmlns:h="http://www.example.org/bar" attr="1" h:bar="bar"><foo:b>hello</foo:b><h:c>2</h:c></foo:a>', true),
        );
    }

    /**
     * @dataProvider getDataForPhpize
     */
    public function testPhpize($expected, $value)
    {
        $this->assertSame($expected, XmlUtils::phpize($value));
    }

    public function getDataForPhpize()
    {
        return array(
            array('', ''),
            array(null, 'null'),
            array(true, 'true'),
            array(false, 'false'),
            array(null, 'Null'),
            array(true, 'True'),
            array(false, 'False'),
            array(0, '0'),
            array(1, '1'),
            array(-1, '-1'),
            array(0777, '0777'),
            array(255, '0xFF'),
            array(100.0, '1e2'),
            array(-120.0, '-1.2E2'),
            array(-10100.1, '-10100.1'),
            array('-10,100.1', '-10,100.1'),
            array('1234 5678 9101 1121 3141', '1234 5678 9101 1121 3141'),
            array('1,2,3,4', '1,2,3,4'),
            array('11,22,33,44', '11,22,33,44'),
            array('11,222,333,4', '11,222,333,4'),
            array('1,222,333,444', '1,222,333,444'),
            array('11,222,333,444', '11,222,333,444'),
            array('111,222,333,444', '111,222,333,444'),
            array('1111,2222,3333,4444,5555', '1111,2222,3333,4444,5555'),
            array('foo', 'foo'),
            array(6, '0b0110'),
        );
    }

    public function testLoadEmptyXmlFile()
    {
        $file = __DIR__.'/../Fixtures/foo.xml';

        if (method_exists($this, 'expectException')) {
            $this->expectException('InvalidArgumentException');
            $this->expectExceptionMessage(sprintf('File %s does not contain valid XML, it is empty.', $file));
        } else {
            $this->setExpectedException('InvalidArgumentException', sprintf('File %s does not contain valid XML, it is empty.', $file));
        }

        XmlUtils::loadFile($file);
    }

    // test for issue https://github.com/symfony/symfony/issues/9731
    public function testLoadWrongEmptyXMLWithErrorHandler()
    {
        $originalDisableEntities = libxml_disable_entity_loader(false);
        $errorReporting = error_reporting(-1);

        set_error_handler(function ($errno, $errstr) {
            throw new \Exception($errstr, $errno);
        });

        $file = __DIR__.'/../Fixtures/foo.xml';
        try {
            try {
                XmlUtils::loadFile($file);
                $this->fail('An exception should have been raised');
            } catch (\InvalidArgumentException $e) {
                $this->assertEquals(sprintf('File %s does not contain valid XML, it is empty.', $file), $e->getMessage());
            }
        } finally {
            restore_error_handler();
            error_reporting($errorReporting);
        }

        $disableEntities = libxml_disable_entity_loader(true);
        libxml_disable_entity_loader($disableEntities);

        libxml_disable_entity_loader($originalDisableEntities);

        $this->assertFalse($disableEntities);

        // should not throw an exception
        XmlUtils::loadFile(__DIR__.'/../Fixtures/Util/valid.xml', __DIR__.'/../Fixtures/Util/schema.xsd');
    }
}

interface Validator
{
    public function validate();
}
