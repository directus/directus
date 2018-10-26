<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Yaml\Tests;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Yaml\Exception\ParseException;
use Symfony\Component\Yaml\Inline;
use Symfony\Component\Yaml\Tag\TaggedValue;
use Symfony\Component\Yaml\Yaml;

class InlineTest extends TestCase
{
    protected function setUp()
    {
        Inline::initialize(0, 0);
    }

    /**
     * @dataProvider getTestsForParse
     */
    public function testParse($yaml, $value, $flags = 0)
    {
        $this->assertSame($value, Inline::parse($yaml, $flags), sprintf('::parse() converts an inline YAML to a PHP structure (%s)', $yaml));
    }

    /**
     * @dataProvider getTestsForParseWithMapObjects
     */
    public function testParseWithMapObjects($yaml, $value, $flags = Yaml::PARSE_OBJECT_FOR_MAP)
    {
        $actual = Inline::parse($yaml, $flags);

        $this->assertSame(serialize($value), serialize($actual));
    }

    /**
     * @dataProvider getTestsForParsePhpConstants
     */
    public function testParsePhpConstants($yaml, $value)
    {
        $actual = Inline::parse($yaml, Yaml::PARSE_CONSTANT);

        $this->assertSame($value, $actual);
    }

    public function getTestsForParsePhpConstants()
    {
        return array(
            array('!php/const Symfony\Component\Yaml\Yaml::PARSE_CONSTANT', Yaml::PARSE_CONSTANT),
            array('!php/const PHP_INT_MAX', PHP_INT_MAX),
            array('[!php/const PHP_INT_MAX]', array(PHP_INT_MAX)),
            array('{ foo: !php/const PHP_INT_MAX }', array('foo' => PHP_INT_MAX)),
            array('!php/const NULL', null),
        );
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage The constant "WRONG_CONSTANT" is not defined
     */
    public function testParsePhpConstantThrowsExceptionWhenUndefined()
    {
        Inline::parse('!php/const WRONG_CONSTANT', Yaml::PARSE_CONSTANT);
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessageRegExp #The string "!php/const PHP_INT_MAX" could not be parsed as a constant.*#
     */
    public function testParsePhpConstantThrowsExceptionOnInvalidType()
    {
        Inline::parse('!php/const PHP_INT_MAX', Yaml::PARSE_EXCEPTION_ON_INVALID_TYPE);
    }

    /**
     * @dataProvider getTestsForDump
     */
    public function testDump($yaml, $value, $parseFlags = 0)
    {
        $this->assertEquals($yaml, Inline::dump($value), sprintf('::dump() converts a PHP structure to an inline YAML (%s)', $yaml));

        $this->assertSame($value, Inline::parse(Inline::dump($value), $parseFlags), 'check consistency');
    }

    public function testDumpNumericValueWithLocale()
    {
        $locale = setlocale(LC_NUMERIC, 0);
        if (false === $locale) {
            $this->markTestSkipped('Your platform does not support locales.');
        }

        try {
            $requiredLocales = array('fr_FR.UTF-8', 'fr_FR.UTF8', 'fr_FR.utf-8', 'fr_FR.utf8', 'French_France.1252');
            if (false === setlocale(LC_NUMERIC, $requiredLocales)) {
                $this->markTestSkipped('Could not set any of required locales: '.implode(', ', $requiredLocales));
            }

            $this->assertEquals('1.2', Inline::dump(1.2));
            $this->assertContains('fr', strtolower(setlocale(LC_NUMERIC, 0)));
        } finally {
            setlocale(LC_NUMERIC, $locale);
        }
    }

    public function testHashStringsResemblingExponentialNumericsShouldNotBeChangedToINF()
    {
        $value = '686e444';

        $this->assertSame($value, Inline::parse(Inline::dump($value)));
    }

    /**
     * @expectedException        \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage Found unknown escape character "\V".
     */
    public function testParseScalarWithNonEscapedBlackslashShouldThrowException()
    {
        Inline::parse('"Foo\Var"');
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     */
    public function testParseScalarWithNonEscapedBlackslashAtTheEndShouldThrowException()
    {
        Inline::parse('"Foo\\"');
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     */
    public function testParseScalarWithIncorrectlyQuotedStringShouldThrowException()
    {
        $value = "'don't do somthin' like that'";
        Inline::parse($value);
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     */
    public function testParseScalarWithIncorrectlyDoubleQuotedStringShouldThrowException()
    {
        $value = '"don"t do somthin" like that"';
        Inline::parse($value);
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     */
    public function testParseInvalidMappingKeyShouldThrowException()
    {
        $value = '{ "foo " bar": "bar" }';
        Inline::parse($value);
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage Colons must be followed by a space or an indication character (i.e. " ", ",", "[", "]", "{", "}")
     */
    public function testParseMappingKeyWithColonNotFollowedBySpace()
    {
        Inline::parse('{foo:""}');
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     */
    public function testParseInvalidMappingShouldThrowException()
    {
        Inline::parse('[foo] bar');
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     */
    public function testParseInvalidSequenceShouldThrowException()
    {
        Inline::parse('{ foo: bar } bar');
    }

    public function testParseScalarWithCorrectlyQuotedStringShouldReturnString()
    {
        $value = "'don''t do somthin'' like that'";
        $expect = "don't do somthin' like that";

        $this->assertSame($expect, Inline::parseScalar($value));
    }

    /**
     * @dataProvider getDataForParseReferences
     */
    public function testParseReferences($yaml, $expected)
    {
        $this->assertSame($expected, Inline::parse($yaml, 0, array('var' => 'var-value')));
    }

    public function getDataForParseReferences()
    {
        return array(
            'scalar' => array('*var', 'var-value'),
            'list' => array('[ *var ]', array('var-value')),
            'list-in-list' => array('[[ *var ]]', array(array('var-value'))),
            'map-in-list' => array('[ { key: *var } ]', array(array('key' => 'var-value'))),
            'embedded-mapping-in-list' => array('[ key: *var ]', array(array('key' => 'var-value'))),
            'map' => array('{ key: *var }', array('key' => 'var-value')),
            'list-in-map' => array('{ key: [*var] }', array('key' => array('var-value'))),
            'map-in-map' => array('{ foo: { bar: *var } }', array('foo' => array('bar' => 'var-value'))),
        );
    }

    public function testParseMapReferenceInSequence()
    {
        $foo = array(
            'a' => 'Steve',
            'b' => 'Clark',
            'c' => 'Brian',
        );
        $this->assertSame(array($foo), Inline::parse('[*foo]', 0, array('foo' => $foo)));
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage A reference must contain at least one character at line 1.
     */
    public function testParseUnquotedAsterisk()
    {
        Inline::parse('{ foo: * }');
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage A reference must contain at least one character at line 1.
     */
    public function testParseUnquotedAsteriskFollowedByAComment()
    {
        Inline::parse('{ foo: * #foo }');
    }

    /**
     * @dataProvider getReservedIndicators
     */
    public function testParseUnquotedScalarStartingWithReservedIndicator($indicator)
    {
        if (method_exists($this, 'expectExceptionMessage')) {
            $this->expectException(ParseException::class);
            $this->expectExceptionMessage(sprintf('cannot start a plain scalar; you need to quote the scalar at line 1 (near "%sfoo").', $indicator));
        } else {
            $this->setExpectedException(ParseException::class, sprintf('cannot start a plain scalar; you need to quote the scalar at line 1 (near "%sfoo").', $indicator));
        }

        Inline::parse(sprintf('{ foo: %sfoo }', $indicator));
    }

    public function getReservedIndicators()
    {
        return array(array('@'), array('`'));
    }

    /**
     * @dataProvider getScalarIndicators
     */
    public function testParseUnquotedScalarStartingWithScalarIndicator($indicator)
    {
        if (method_exists($this, 'expectExceptionMessage')) {
            $this->expectException(ParseException::class);
            $this->expectExceptionMessage(sprintf('cannot start a plain scalar; you need to quote the scalar at line 1 (near "%sfoo").', $indicator));
        } else {
            $this->setExpectedException(ParseException::class, sprintf('cannot start a plain scalar; you need to quote the scalar at line 1 (near "%sfoo").', $indicator));
        }

        Inline::parse(sprintf('{ foo: %sfoo }', $indicator));
    }

    public function getScalarIndicators()
    {
        return array(array('|'), array('>'), array('%'));
    }

    /**
     * @dataProvider getDataForIsHash
     */
    public function testIsHash($array, $expected)
    {
        $this->assertSame($expected, Inline::isHash($array));
    }

    public function getDataForIsHash()
    {
        return array(
            array(array(), false),
            array(array(1, 2, 3), false),
            array(array(2 => 1, 1 => 2, 0 => 3), true),
            array(array('foo' => 1, 'bar' => 2), true),
        );
    }

    public function getTestsForParse()
    {
        return array(
            array('', ''),
            array('null', null),
            array('false', false),
            array('true', true),
            array('12', 12),
            array('-12', -12),
            array('1_2', 12),
            array('_12', '_12'),
            array('12_', 12),
            array('"quoted string"', 'quoted string'),
            array("'quoted string'", 'quoted string'),
            array('12.30e+02', 12.30e+02),
            array('123.45_67', 123.4567),
            array('0x4D2', 0x4D2),
            array('0x_4_D_2_', 0x4D2),
            array('02333', 02333),
            array('0_2_3_3_3', 02333),
            array('.Inf', -log(0)),
            array('-.Inf', log(0)),
            array("'686e444'", '686e444'),
            array('686e444', 646e444),
            array('123456789123456789123456789123456789', '123456789123456789123456789123456789'),
            array('"foo\r\nbar"', "foo\r\nbar"),
            array("'foo#bar'", 'foo#bar'),
            array("'foo # bar'", 'foo # bar'),
            array("'#cfcfcf'", '#cfcfcf'),
            array('::form_base.html.twig', '::form_base.html.twig'),

            // Pre-YAML-1.2 booleans
            array("'y'", 'y'),
            array("'n'", 'n'),
            array("'yes'", 'yes'),
            array("'no'", 'no'),
            array("'on'", 'on'),
            array("'off'", 'off'),

            array('2007-10-30', gmmktime(0, 0, 0, 10, 30, 2007)),
            array('2007-10-30T02:59:43Z', gmmktime(2, 59, 43, 10, 30, 2007)),
            array('2007-10-30 02:59:43 Z', gmmktime(2, 59, 43, 10, 30, 2007)),
            array('1960-10-30 02:59:43 Z', gmmktime(2, 59, 43, 10, 30, 1960)),
            array('1730-10-30T02:59:43Z', gmmktime(2, 59, 43, 10, 30, 1730)),

            array('"a \\"string\\" with \'quoted strings inside\'"', 'a "string" with \'quoted strings inside\''),
            array("'a \"string\" with ''quoted strings inside'''", 'a "string" with \'quoted strings inside\''),

            // sequences
            // urls are no key value mapping. see #3609. Valid yaml "key: value" mappings require a space after the colon
            array('[foo, http://urls.are/no/mappings, false, null, 12]', array('foo', 'http://urls.are/no/mappings', false, null, 12)),
            array('[  foo  ,   bar , false  ,  null     ,  12  ]', array('foo', 'bar', false, null, 12)),
            array('[\'foo,bar\', \'foo bar\']', array('foo,bar', 'foo bar')),

            // mappings
            array('{foo: bar,bar: foo,"false": false, "null": null,integer: 12}', array('foo' => 'bar', 'bar' => 'foo', 'false' => false, 'null' => null, 'integer' => 12)),
            array('{ foo  : bar, bar : foo, "false"  :   false,  "null"  :   null,  integer :  12  }', array('foo' => 'bar', 'bar' => 'foo', 'false' => false, 'null' => null, 'integer' => 12)),
            array('{foo: \'bar\', bar: \'foo: bar\'}', array('foo' => 'bar', 'bar' => 'foo: bar')),
            array('{\'foo\': \'bar\', "bar": \'foo: bar\'}', array('foo' => 'bar', 'bar' => 'foo: bar')),
            array('{\'foo\'\'\': \'bar\', "bar\"": \'foo: bar\'}', array('foo\'' => 'bar', 'bar"' => 'foo: bar')),
            array('{\'foo: \': \'bar\', "bar: ": \'foo: bar\'}', array('foo: ' => 'bar', 'bar: ' => 'foo: bar')),
            array('{"foo:bar": "baz"}', array('foo:bar' => 'baz')),
            array('{"foo":"bar"}', array('foo' => 'bar')),

            // nested sequences and mappings
            array('[foo, [bar, foo]]', array('foo', array('bar', 'foo'))),
            array('[foo, {bar: foo}]', array('foo', array('bar' => 'foo'))),
            array('{ foo: {bar: foo} }', array('foo' => array('bar' => 'foo'))),
            array('{ foo: [bar, foo] }', array('foo' => array('bar', 'foo'))),
            array('{ foo:{bar: foo} }', array('foo' => array('bar' => 'foo'))),
            array('{ foo:[bar, foo] }', array('foo' => array('bar', 'foo'))),

            array('[  foo, [  bar, foo  ]  ]', array('foo', array('bar', 'foo'))),

            array('[{ foo: {bar: foo} }]', array(array('foo' => array('bar' => 'foo')))),

            array('[foo, [bar, [foo, [bar, foo]], foo]]', array('foo', array('bar', array('foo', array('bar', 'foo')), 'foo'))),

            array('[foo, {bar: foo, foo: [foo, {bar: foo}]}, [foo, {bar: foo}]]', array('foo', array('bar' => 'foo', 'foo' => array('foo', array('bar' => 'foo'))), array('foo', array('bar' => 'foo')))),

            array('[foo, bar: { foo: bar }]', array('foo', '1' => array('bar' => array('foo' => 'bar')))),
            array('[foo, \'@foo.baz\', { \'%foo%\': \'foo is %foo%\', bar: \'%foo%\' }, true, \'@service_container\']', array('foo', '@foo.baz', array('%foo%' => 'foo is %foo%', 'bar' => '%foo%'), true, '@service_container')),
        );
    }

    public function getTestsForParseWithMapObjects()
    {
        return array(
            array('', ''),
            array('null', null),
            array('false', false),
            array('true', true),
            array('12', 12),
            array('-12', -12),
            array('"quoted string"', 'quoted string'),
            array("'quoted string'", 'quoted string'),
            array('12.30e+02', 12.30e+02),
            array('0x4D2', 0x4D2),
            array('02333', 02333),
            array('.Inf', -log(0)),
            array('-.Inf', log(0)),
            array("'686e444'", '686e444'),
            array('686e444', 646e444),
            array('123456789123456789123456789123456789', '123456789123456789123456789123456789'),
            array('"foo\r\nbar"', "foo\r\nbar"),
            array("'foo#bar'", 'foo#bar'),
            array("'foo # bar'", 'foo # bar'),
            array("'#cfcfcf'", '#cfcfcf'),
            array('::form_base.html.twig', '::form_base.html.twig'),

            array('2007-10-30', gmmktime(0, 0, 0, 10, 30, 2007)),
            array('2007-10-30T02:59:43Z', gmmktime(2, 59, 43, 10, 30, 2007)),
            array('2007-10-30 02:59:43 Z', gmmktime(2, 59, 43, 10, 30, 2007)),
            array('1960-10-30 02:59:43 Z', gmmktime(2, 59, 43, 10, 30, 1960)),
            array('1730-10-30T02:59:43Z', gmmktime(2, 59, 43, 10, 30, 1730)),

            array('"a \\"string\\" with \'quoted strings inside\'"', 'a "string" with \'quoted strings inside\''),
            array("'a \"string\" with ''quoted strings inside'''", 'a "string" with \'quoted strings inside\''),

            // sequences
            // urls are no key value mapping. see #3609. Valid yaml "key: value" mappings require a space after the colon
            array('[foo, http://urls.are/no/mappings, false, null, 12]', array('foo', 'http://urls.are/no/mappings', false, null, 12)),
            array('[  foo  ,   bar , false  ,  null     ,  12  ]', array('foo', 'bar', false, null, 12)),
            array('[\'foo,bar\', \'foo bar\']', array('foo,bar', 'foo bar')),

            // mappings
            array('{foo: bar,bar: foo,"false": false,"null": null,integer: 12}', (object) array('foo' => 'bar', 'bar' => 'foo', 'false' => false, 'null' => null, 'integer' => 12), Yaml::PARSE_OBJECT_FOR_MAP),
            array('{ foo  : bar, bar : foo,  "false"  :   false,  "null"  :   null,  integer :  12  }', (object) array('foo' => 'bar', 'bar' => 'foo', 'false' => false, 'null' => null, 'integer' => 12), Yaml::PARSE_OBJECT_FOR_MAP),
            array('{foo: \'bar\', bar: \'foo: bar\'}', (object) array('foo' => 'bar', 'bar' => 'foo: bar')),
            array('{\'foo\': \'bar\', "bar": \'foo: bar\'}', (object) array('foo' => 'bar', 'bar' => 'foo: bar')),
            array('{\'foo\'\'\': \'bar\', "bar\"": \'foo: bar\'}', (object) array('foo\'' => 'bar', 'bar"' => 'foo: bar')),
            array('{\'foo: \': \'bar\', "bar: ": \'foo: bar\'}', (object) array('foo: ' => 'bar', 'bar: ' => 'foo: bar')),
            array('{"foo:bar": "baz"}', (object) array('foo:bar' => 'baz')),
            array('{"foo":"bar"}', (object) array('foo' => 'bar')),

            // nested sequences and mappings
            array('[foo, [bar, foo]]', array('foo', array('bar', 'foo'))),
            array('[foo, {bar: foo}]', array('foo', (object) array('bar' => 'foo'))),
            array('{ foo: {bar: foo} }', (object) array('foo' => (object) array('bar' => 'foo'))),
            array('{ foo: [bar, foo] }', (object) array('foo' => array('bar', 'foo'))),

            array('[  foo, [  bar, foo  ]  ]', array('foo', array('bar', 'foo'))),

            array('[{ foo: {bar: foo} }]', array((object) array('foo' => (object) array('bar' => 'foo')))),

            array('[foo, [bar, [foo, [bar, foo]], foo]]', array('foo', array('bar', array('foo', array('bar', 'foo')), 'foo'))),

            array('[foo, {bar: foo, foo: [foo, {bar: foo}]}, [foo, {bar: foo}]]', array('foo', (object) array('bar' => 'foo', 'foo' => array('foo', (object) array('bar' => 'foo'))), array('foo', (object) array('bar' => 'foo')))),

            array('[foo, bar: { foo: bar }]', array('foo', '1' => (object) array('bar' => (object) array('foo' => 'bar')))),
            array('[foo, \'@foo.baz\', { \'%foo%\': \'foo is %foo%\', bar: \'%foo%\' }, true, \'@service_container\']', array('foo', '@foo.baz', (object) array('%foo%' => 'foo is %foo%', 'bar' => '%foo%'), true, '@service_container')),

            array('{}', new \stdClass()),
            array('{ foo  : bar, bar : {}  }', (object) array('foo' => 'bar', 'bar' => new \stdClass())),
            array('{ foo  : [], bar : {}  }', (object) array('foo' => array(), 'bar' => new \stdClass())),
            array('{foo: \'bar\', bar: {} }', (object) array('foo' => 'bar', 'bar' => new \stdClass())),
            array('{\'foo\': \'bar\', "bar": {}}', (object) array('foo' => 'bar', 'bar' => new \stdClass())),
            array('{\'foo\': \'bar\', "bar": \'{}\'}', (object) array('foo' => 'bar', 'bar' => '{}')),

            array('[foo, [{}, {}]]', array('foo', array(new \stdClass(), new \stdClass()))),
            array('[foo, [[], {}]]', array('foo', array(array(), new \stdClass()))),
            array('[foo, [[{}, {}], {}]]', array('foo', array(array(new \stdClass(), new \stdClass()), new \stdClass()))),
            array('[foo, {bar: {}}]', array('foo', '1' => (object) array('bar' => new \stdClass()))),
        );
    }

    public function getTestsForDump()
    {
        return array(
            array('null', null),
            array('false', false),
            array('true', true),
            array('12', 12),
            array("'1_2'", '1_2'),
            array('_12', '_12'),
            array("'12_'", '12_'),
            array("'quoted string'", 'quoted string'),
            array('!!float 1230', 12.30e+02),
            array('1234', 0x4D2),
            array('1243', 02333),
            array("'0x_4_D_2_'", '0x_4_D_2_'),
            array("'0_2_3_3_3'", '0_2_3_3_3'),
            array('.Inf', -log(0)),
            array('-.Inf', log(0)),
            array("'686e444'", '686e444'),
            array('"foo\r\nbar"', "foo\r\nbar"),
            array("'foo#bar'", 'foo#bar'),
            array("'foo # bar'", 'foo # bar'),
            array("'#cfcfcf'", '#cfcfcf'),

            array("'a \"string\" with ''quoted strings inside'''", 'a "string" with \'quoted strings inside\''),

            array("'-dash'", '-dash'),
            array("'-'", '-'),

            // Pre-YAML-1.2 booleans
            array("'y'", 'y'),
            array("'n'", 'n'),
            array("'yes'", 'yes'),
            array("'no'", 'no'),
            array("'on'", 'on'),
            array("'off'", 'off'),

            // sequences
            array('[foo, bar, false, null, 12]', array('foo', 'bar', false, null, 12)),
            array('[\'foo,bar\', \'foo bar\']', array('foo,bar', 'foo bar')),

            // mappings
            array('{ foo: bar, bar: foo, \'false\': false, \'null\': null, integer: 12 }', array('foo' => 'bar', 'bar' => 'foo', 'false' => false, 'null' => null, 'integer' => 12)),
            array('{ foo: bar, bar: \'foo: bar\' }', array('foo' => 'bar', 'bar' => 'foo: bar')),

            // nested sequences and mappings
            array('[foo, [bar, foo]]', array('foo', array('bar', 'foo'))),

            array('[foo, [bar, [foo, [bar, foo]], foo]]', array('foo', array('bar', array('foo', array('bar', 'foo')), 'foo'))),

            array('{ foo: { bar: foo } }', array('foo' => array('bar' => 'foo'))),

            array('[foo, { bar: foo }]', array('foo', array('bar' => 'foo'))),

            array('[foo, { bar: foo, foo: [foo, { bar: foo }] }, [foo, { bar: foo }]]', array('foo', array('bar' => 'foo', 'foo' => array('foo', array('bar' => 'foo'))), array('foo', array('bar' => 'foo')))),

            array('[foo, \'@foo.baz\', { \'%foo%\': \'foo is %foo%\', bar: \'%foo%\' }, true, \'@service_container\']', array('foo', '@foo.baz', array('%foo%' => 'foo is %foo%', 'bar' => '%foo%'), true, '@service_container')),

            array('{ foo: { bar: { 1: 2, baz: 3 } } }', array('foo' => array('bar' => array(1 => 2, 'baz' => 3)))),
        );
    }

    /**
     * @dataProvider getTimestampTests
     */
    public function testParseTimestampAsUnixTimestampByDefault($yaml, $year, $month, $day, $hour, $minute, $second)
    {
        $this->assertSame(gmmktime($hour, $minute, $second, $month, $day, $year), Inline::parse($yaml));
    }

    /**
     * @dataProvider getTimestampTests
     */
    public function testParseTimestampAsDateTimeObject($yaml, $year, $month, $day, $hour, $minute, $second, $timezone)
    {
        $expected = new \DateTime($yaml);
        $expected->setTimeZone(new \DateTimeZone('UTC'));
        $expected->setDate($year, $month, $day);
        $expected->setTime($hour, $minute, $second, 1000000 * ($second - (int) $second));

        $date = Inline::parse($yaml, Yaml::PARSE_DATETIME);
        $this->assertEquals($expected, $date);
        $this->assertSame($timezone, $date->format('O'));
    }

    public function getTimestampTests()
    {
        return array(
            'canonical' => array('2001-12-15T02:59:43.1Z', 2001, 12, 15, 2, 59, 43.1, '+0000'),
            'ISO-8601' => array('2001-12-15t21:59:43.10-05:00', 2001, 12, 16, 2, 59, 43.1, '-0500'),
            'spaced' => array('2001-12-15 21:59:43.10 -5', 2001, 12, 16, 2, 59, 43.1, '-0500'),
            'date' => array('2001-12-15', 2001, 12, 15, 0, 0, 0, '+0000'),
        );
    }

    /**
     * @dataProvider getTimestampTests
     */
    public function testParseNestedTimestampListAsDateTimeObject($yaml, $year, $month, $day, $hour, $minute, $second)
    {
        $expected = new \DateTime($yaml);
        $expected->setTimeZone(new \DateTimeZone('UTC'));
        $expected->setDate($year, $month, $day);
        $expected->setTime($hour, $minute, $second, 1000000 * ($second - (int) $second));

        $expectedNested = array('nested' => array($expected));
        $yamlNested = "{nested: [$yaml]}";

        $this->assertEquals($expectedNested, Inline::parse($yamlNested, Yaml::PARSE_DATETIME));
    }

    /**
     * @dataProvider getDateTimeDumpTests
     */
    public function testDumpDateTime($dateTime, $expected)
    {
        $this->assertSame($expected, Inline::dump($dateTime));
    }

    public function getDateTimeDumpTests()
    {
        $tests = array();

        $dateTime = new \DateTime('2001-12-15 21:59:43', new \DateTimeZone('UTC'));
        $tests['date-time-utc'] = array($dateTime, '2001-12-15T21:59:43+00:00');

        $dateTime = new \DateTimeImmutable('2001-07-15 21:59:43', new \DateTimeZone('Europe/Berlin'));
        $tests['immutable-date-time-europe-berlin'] = array($dateTime, '2001-07-15T21:59:43+02:00');

        return $tests;
    }

    /**
     * @dataProvider getBinaryData
     */
    public function testParseBinaryData($data)
    {
        $this->assertSame('Hello world', Inline::parse($data));
    }

    public function getBinaryData()
    {
        return array(
            'enclosed with double quotes' => array('!!binary "SGVsbG8gd29ybGQ="'),
            'enclosed with single quotes' => array("!!binary 'SGVsbG8gd29ybGQ='"),
            'containing spaces' => array('!!binary  "SGVs bG8gd 29ybGQ="'),
        );
    }

    /**
     * @dataProvider getInvalidBinaryData
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     */
    public function testParseInvalidBinaryData($data, $expectedMessage)
    {
        if (method_exists($this, 'expectException')) {
            $this->expectExceptionMessageRegExp($expectedMessage);
        } else {
            $this->setExpectedExceptionRegExp(ParseException::class, $expectedMessage);
        }

        Inline::parse($data);
    }

    public function getInvalidBinaryData()
    {
        return array(
            'length not a multiple of four' => array('!!binary "SGVsbG8d29ybGQ="', '/The normalized base64 encoded data \(data without whitespace characters\) length must be a multiple of four \(\d+ bytes given\)/'),
            'invalid characters' => array('!!binary "SGVsbG8#d29ybGQ="', '/The base64 encoded data \(.*\) contains invalid characters/'),
            'too many equals characters' => array('!!binary "SGVsbG8gd29yb==="', '/The base64 encoded data \(.*\) contains invalid characters/'),
            'misplaced equals character' => array('!!binary "SGVsbG8gd29ybG=Q"', '/The base64 encoded data \(.*\) contains invalid characters/'),
        );
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage Malformed inline YAML string: {this, is not, supported} at line 1.
     */
    public function testNotSupportedMissingValue()
    {
        Inline::parse('{this, is not, supported}');
    }

    public function testVeryLongQuotedStrings()
    {
        $longStringWithQuotes = str_repeat("x\r\n\\\"x\"x", 1000);

        $yamlString = Inline::dump(array('longStringWithQuotes' => $longStringWithQuotes));
        $arrayFromYaml = Inline::parse($yamlString);

        $this->assertEquals($longStringWithQuotes, $arrayFromYaml['longStringWithQuotes']);
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage Missing mapping key
     */
    public function testMappingKeysCannotBeOmitted()
    {
        Inline::parse('{: foo}');
    }

    /**
     * @dataProvider getTestsForNullValues
     */
    public function testParseMissingMappingValueAsNull($yaml, $expected)
    {
        $this->assertSame($expected, Inline::parse($yaml));
    }

    public function getTestsForNullValues()
    {
        return array(
            'null before closing curly brace' => array('{foo:}', array('foo' => null)),
            'null before comma' => array('{foo:, bar: baz}', array('foo' => null, 'bar' => 'baz')),
        );
    }

    public function testTheEmptyStringIsAValidMappingKey()
    {
        $this->assertSame(array('' => 'foo'), Inline::parse('{ "": foo }'));
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage Implicit casting of incompatible mapping keys to strings is not supported. Quote your evaluable mapping keys instead
     *
     * @dataProvider getNotPhpCompatibleMappingKeyData
     */
    public function testImplicitStringCastingOfMappingKeysIsDeprecated($yaml, $expected)
    {
        $this->assertSame($expected, Inline::parse($yaml));
    }

    public function getNotPhpCompatibleMappingKeyData()
    {
        return array(
            'boolean-true' => array('{true: "foo"}', array('true' => 'foo')),
            'boolean-false' => array('{false: "foo"}', array('false' => 'foo')),
            'null' => array('{null: "foo"}', array('null' => 'foo')),
            'float' => array('{0.25: "foo"}', array('0.25' => 'foo')),
        );
    }

    public function testTagWithoutValueInSequence()
    {
        $value = Inline::parse('[!foo]', Yaml::PARSE_CUSTOM_TAGS);

        $this->assertInstanceOf(TaggedValue::class, $value[0]);
        $this->assertSame('foo', $value[0]->getTag());
        $this->assertSame('', $value[0]->getValue());
    }

    public function testTagWithEmptyValueInSequence()
    {
        $value = Inline::parse('[!foo ""]', Yaml::PARSE_CUSTOM_TAGS);

        $this->assertInstanceOf(TaggedValue::class, $value[0]);
        $this->assertSame('foo', $value[0]->getTag());
        $this->assertSame('', $value[0]->getValue());
    }

    public function testTagWithoutValueInMapping()
    {
        $value = Inline::parse('{foo: !bar}', Yaml::PARSE_CUSTOM_TAGS);

        $this->assertInstanceOf(TaggedValue::class, $value['foo']);
        $this->assertSame('bar', $value['foo']->getTag());
        $this->assertSame('', $value['foo']->getValue());
    }

    public function testTagWithEmptyValueInMapping()
    {
        $value = Inline::parse('{foo: !bar ""}', Yaml::PARSE_CUSTOM_TAGS);

        $this->assertInstanceOf(TaggedValue::class, $value['foo']);
        $this->assertSame('bar', $value['foo']->getTag());
        $this->assertSame('', $value['foo']->getValue());
    }

    /**
     * @expectedException \Symfony\Component\Yaml\Exception\ParseException
     * @expectedExceptionMessage Unexpected end of line, expected one of ",}" at line 1 (near "{abc: 'def'").
     */
    public function testUnfinishedInlineMap()
    {
        Inline::parse("{abc: 'def'");
    }
}
