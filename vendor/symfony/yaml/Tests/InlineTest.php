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
        return [
            ['!php/const Symfony\Component\Yaml\Yaml::PARSE_CONSTANT', Yaml::PARSE_CONSTANT],
            ['!php/const PHP_INT_MAX', PHP_INT_MAX],
            ['[!php/const PHP_INT_MAX]', [PHP_INT_MAX]],
            ['{ foo: !php/const PHP_INT_MAX }', ['foo' => PHP_INT_MAX]],
            ['!php/const NULL', null],
        ];
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
            $requiredLocales = ['fr_FR.UTF-8', 'fr_FR.UTF8', 'fr_FR.utf-8', 'fr_FR.utf8', 'French_France.1252'];
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
        $this->assertSame($expected, Inline::parse($yaml, 0, ['var' => 'var-value']));
    }

    public function getDataForParseReferences()
    {
        return [
            'scalar' => ['*var', 'var-value'],
            'list' => ['[ *var ]', ['var-value']],
            'list-in-list' => ['[[ *var ]]', [['var-value']]],
            'map-in-list' => ['[ { key: *var } ]', [['key' => 'var-value']]],
            'embedded-mapping-in-list' => ['[ key: *var ]', [['key' => 'var-value']]],
            'map' => ['{ key: *var }', ['key' => 'var-value']],
            'list-in-map' => ['{ key: [*var] }', ['key' => ['var-value']]],
            'map-in-map' => ['{ foo: { bar: *var } }', ['foo' => ['bar' => 'var-value']]],
        ];
    }

    public function testParseMapReferenceInSequence()
    {
        $foo = [
            'a' => 'Steve',
            'b' => 'Clark',
            'c' => 'Brian',
        ];
        $this->assertSame([$foo], Inline::parse('[*foo]', 0, ['foo' => $foo]));
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
        return [['@'], ['`']];
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
        return [['|'], ['>'], ['%']];
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
        return [
            [[], false],
            [[1, 2, 3], false],
            [[2 => 1, 1 => 2, 0 => 3], true],
            [['foo' => 1, 'bar' => 2], true],
        ];
    }

    public function getTestsForParse()
    {
        return [
            ['', ''],
            ['null', null],
            ['false', false],
            ['true', true],
            ['12', 12],
            ['-12', -12],
            ['1_2', 12],
            ['_12', '_12'],
            ['12_', 12],
            ['"quoted string"', 'quoted string'],
            ["'quoted string'", 'quoted string'],
            ['12.30e+02', 12.30e+02],
            ['123.45_67', 123.4567],
            ['0x4D2', 0x4D2],
            ['0x_4_D_2_', 0x4D2],
            ['02333', 02333],
            ['0_2_3_3_3', 02333],
            ['.Inf', -log(0)],
            ['-.Inf', log(0)],
            ["'686e444'", '686e444'],
            ['686e444', 646e444],
            ['123456789123456789123456789123456789', '123456789123456789123456789123456789'],
            ['"foo\r\nbar"', "foo\r\nbar"],
            ["'foo#bar'", 'foo#bar'],
            ["'foo # bar'", 'foo # bar'],
            ["'#cfcfcf'", '#cfcfcf'],
            ['::form_base.html.twig', '::form_base.html.twig'],

            // Pre-YAML-1.2 booleans
            ["'y'", 'y'],
            ["'n'", 'n'],
            ["'yes'", 'yes'],
            ["'no'", 'no'],
            ["'on'", 'on'],
            ["'off'", 'off'],

            ['2007-10-30', gmmktime(0, 0, 0, 10, 30, 2007)],
            ['2007-10-30T02:59:43Z', gmmktime(2, 59, 43, 10, 30, 2007)],
            ['2007-10-30 02:59:43 Z', gmmktime(2, 59, 43, 10, 30, 2007)],
            ['1960-10-30 02:59:43 Z', gmmktime(2, 59, 43, 10, 30, 1960)],
            ['1730-10-30T02:59:43Z', gmmktime(2, 59, 43, 10, 30, 1730)],

            ['"a \\"string\\" with \'quoted strings inside\'"', 'a "string" with \'quoted strings inside\''],
            ["'a \"string\" with ''quoted strings inside'''", 'a "string" with \'quoted strings inside\''],

            // sequences
            // urls are no key value mapping. see #3609. Valid yaml "key: value" mappings require a space after the colon
            ['[foo, http://urls.are/no/mappings, false, null, 12]', ['foo', 'http://urls.are/no/mappings', false, null, 12]],
            ['[  foo  ,   bar , false  ,  null     ,  12  ]', ['foo', 'bar', false, null, 12]],
            ['[\'foo,bar\', \'foo bar\']', ['foo,bar', 'foo bar']],

            // mappings
            ['{foo: bar,bar: foo,"false": false, "null": null,integer: 12}', ['foo' => 'bar', 'bar' => 'foo', 'false' => false, 'null' => null, 'integer' => 12]],
            ['{ foo  : bar, bar : foo, "false"  :   false,  "null"  :   null,  integer :  12  }', ['foo' => 'bar', 'bar' => 'foo', 'false' => false, 'null' => null, 'integer' => 12]],
            ['{foo: \'bar\', bar: \'foo: bar\'}', ['foo' => 'bar', 'bar' => 'foo: bar']],
            ['{\'foo\': \'bar\', "bar": \'foo: bar\'}', ['foo' => 'bar', 'bar' => 'foo: bar']],
            ['{\'foo\'\'\': \'bar\', "bar\"": \'foo: bar\'}', ['foo\'' => 'bar', 'bar"' => 'foo: bar']],
            ['{\'foo: \': \'bar\', "bar: ": \'foo: bar\'}', ['foo: ' => 'bar', 'bar: ' => 'foo: bar']],
            ['{"foo:bar": "baz"}', ['foo:bar' => 'baz']],
            ['{"foo":"bar"}', ['foo' => 'bar']],

            // nested sequences and mappings
            ['[foo, [bar, foo]]', ['foo', ['bar', 'foo']]],
            ['[foo, {bar: foo}]', ['foo', ['bar' => 'foo']]],
            ['{ foo: {bar: foo} }', ['foo' => ['bar' => 'foo']]],
            ['{ foo: [bar, foo] }', ['foo' => ['bar', 'foo']]],
            ['{ foo:{bar: foo} }', ['foo' => ['bar' => 'foo']]],
            ['{ foo:[bar, foo] }', ['foo' => ['bar', 'foo']]],

            ['[  foo, [  bar, foo  ]  ]', ['foo', ['bar', 'foo']]],

            ['[{ foo: {bar: foo} }]', [['foo' => ['bar' => 'foo']]]],

            ['[foo, [bar, [foo, [bar, foo]], foo]]', ['foo', ['bar', ['foo', ['bar', 'foo']], 'foo']]],

            ['[foo, {bar: foo, foo: [foo, {bar: foo}]}, [foo, {bar: foo}]]', ['foo', ['bar' => 'foo', 'foo' => ['foo', ['bar' => 'foo']]], ['foo', ['bar' => 'foo']]]],

            ['[foo, bar: { foo: bar }]', ['foo', '1' => ['bar' => ['foo' => 'bar']]]],
            ['[foo, \'@foo.baz\', { \'%foo%\': \'foo is %foo%\', bar: \'%foo%\' }, true, \'@service_container\']', ['foo', '@foo.baz', ['%foo%' => 'foo is %foo%', 'bar' => '%foo%'], true, '@service_container']],
        ];
    }

    public function getTestsForParseWithMapObjects()
    {
        return [
            ['', ''],
            ['null', null],
            ['false', false],
            ['true', true],
            ['12', 12],
            ['-12', -12],
            ['"quoted string"', 'quoted string'],
            ["'quoted string'", 'quoted string'],
            ['12.30e+02', 12.30e+02],
            ['0x4D2', 0x4D2],
            ['02333', 02333],
            ['.Inf', -log(0)],
            ['-.Inf', log(0)],
            ["'686e444'", '686e444'],
            ['686e444', 646e444],
            ['123456789123456789123456789123456789', '123456789123456789123456789123456789'],
            ['"foo\r\nbar"', "foo\r\nbar"],
            ["'foo#bar'", 'foo#bar'],
            ["'foo # bar'", 'foo # bar'],
            ["'#cfcfcf'", '#cfcfcf'],
            ['::form_base.html.twig', '::form_base.html.twig'],

            ['2007-10-30', gmmktime(0, 0, 0, 10, 30, 2007)],
            ['2007-10-30T02:59:43Z', gmmktime(2, 59, 43, 10, 30, 2007)],
            ['2007-10-30 02:59:43 Z', gmmktime(2, 59, 43, 10, 30, 2007)],
            ['1960-10-30 02:59:43 Z', gmmktime(2, 59, 43, 10, 30, 1960)],
            ['1730-10-30T02:59:43Z', gmmktime(2, 59, 43, 10, 30, 1730)],

            ['"a \\"string\\" with \'quoted strings inside\'"', 'a "string" with \'quoted strings inside\''],
            ["'a \"string\" with ''quoted strings inside'''", 'a "string" with \'quoted strings inside\''],

            // sequences
            // urls are no key value mapping. see #3609. Valid yaml "key: value" mappings require a space after the colon
            ['[foo, http://urls.are/no/mappings, false, null, 12]', ['foo', 'http://urls.are/no/mappings', false, null, 12]],
            ['[  foo  ,   bar , false  ,  null     ,  12  ]', ['foo', 'bar', false, null, 12]],
            ['[\'foo,bar\', \'foo bar\']', ['foo,bar', 'foo bar']],

            // mappings
            ['{foo: bar,bar: foo,"false": false,"null": null,integer: 12}', (object) ['foo' => 'bar', 'bar' => 'foo', 'false' => false, 'null' => null, 'integer' => 12], Yaml::PARSE_OBJECT_FOR_MAP],
            ['{ foo  : bar, bar : foo,  "false"  :   false,  "null"  :   null,  integer :  12  }', (object) ['foo' => 'bar', 'bar' => 'foo', 'false' => false, 'null' => null, 'integer' => 12], Yaml::PARSE_OBJECT_FOR_MAP],
            ['{foo: \'bar\', bar: \'foo: bar\'}', (object) ['foo' => 'bar', 'bar' => 'foo: bar']],
            ['{\'foo\': \'bar\', "bar": \'foo: bar\'}', (object) ['foo' => 'bar', 'bar' => 'foo: bar']],
            ['{\'foo\'\'\': \'bar\', "bar\"": \'foo: bar\'}', (object) ['foo\'' => 'bar', 'bar"' => 'foo: bar']],
            ['{\'foo: \': \'bar\', "bar: ": \'foo: bar\'}', (object) ['foo: ' => 'bar', 'bar: ' => 'foo: bar']],
            ['{"foo:bar": "baz"}', (object) ['foo:bar' => 'baz']],
            ['{"foo":"bar"}', (object) ['foo' => 'bar']],

            // nested sequences and mappings
            ['[foo, [bar, foo]]', ['foo', ['bar', 'foo']]],
            ['[foo, {bar: foo}]', ['foo', (object) ['bar' => 'foo']]],
            ['{ foo: {bar: foo} }', (object) ['foo' => (object) ['bar' => 'foo']]],
            ['{ foo: [bar, foo] }', (object) ['foo' => ['bar', 'foo']]],

            ['[  foo, [  bar, foo  ]  ]', ['foo', ['bar', 'foo']]],

            ['[{ foo: {bar: foo} }]', [(object) ['foo' => (object) ['bar' => 'foo']]]],

            ['[foo, [bar, [foo, [bar, foo]], foo]]', ['foo', ['bar', ['foo', ['bar', 'foo']], 'foo']]],

            ['[foo, {bar: foo, foo: [foo, {bar: foo}]}, [foo, {bar: foo}]]', ['foo', (object) ['bar' => 'foo', 'foo' => ['foo', (object) ['bar' => 'foo']]], ['foo', (object) ['bar' => 'foo']]]],

            ['[foo, bar: { foo: bar }]', ['foo', '1' => (object) ['bar' => (object) ['foo' => 'bar']]]],
            ['[foo, \'@foo.baz\', { \'%foo%\': \'foo is %foo%\', bar: \'%foo%\' }, true, \'@service_container\']', ['foo', '@foo.baz', (object) ['%foo%' => 'foo is %foo%', 'bar' => '%foo%'], true, '@service_container']],

            ['{}', new \stdClass()],
            ['{ foo  : bar, bar : {}  }', (object) ['foo' => 'bar', 'bar' => new \stdClass()]],
            ['{ foo  : [], bar : {}  }', (object) ['foo' => [], 'bar' => new \stdClass()]],
            ['{foo: \'bar\', bar: {} }', (object) ['foo' => 'bar', 'bar' => new \stdClass()]],
            ['{\'foo\': \'bar\', "bar": {}}', (object) ['foo' => 'bar', 'bar' => new \stdClass()]],
            ['{\'foo\': \'bar\', "bar": \'{}\'}', (object) ['foo' => 'bar', 'bar' => '{}']],

            ['[foo, [{}, {}]]', ['foo', [new \stdClass(), new \stdClass()]]],
            ['[foo, [[], {}]]', ['foo', [[], new \stdClass()]]],
            ['[foo, [[{}, {}], {}]]', ['foo', [[new \stdClass(), new \stdClass()], new \stdClass()]]],
            ['[foo, {bar: {}}]', ['foo', '1' => (object) ['bar' => new \stdClass()]]],
        ];
    }

    public function getTestsForDump()
    {
        return [
            ['null', null],
            ['false', false],
            ['true', true],
            ['12', 12],
            ["'1_2'", '1_2'],
            ['_12', '_12'],
            ["'12_'", '12_'],
            ["'quoted string'", 'quoted string'],
            ['!!float 1230', 12.30e+02],
            ['1234', 0x4D2],
            ['1243', 02333],
            ["'0x_4_D_2_'", '0x_4_D_2_'],
            ["'0_2_3_3_3'", '0_2_3_3_3'],
            ['.Inf', -log(0)],
            ['-.Inf', log(0)],
            ["'686e444'", '686e444'],
            ['"foo\r\nbar"', "foo\r\nbar"],
            ["'foo#bar'", 'foo#bar'],
            ["'foo # bar'", 'foo # bar'],
            ["'#cfcfcf'", '#cfcfcf'],

            ["'a \"string\" with ''quoted strings inside'''", 'a "string" with \'quoted strings inside\''],

            ["'-dash'", '-dash'],
            ["'-'", '-'],

            // Pre-YAML-1.2 booleans
            ["'y'", 'y'],
            ["'n'", 'n'],
            ["'yes'", 'yes'],
            ["'no'", 'no'],
            ["'on'", 'on'],
            ["'off'", 'off'],

            // sequences
            ['[foo, bar, false, null, 12]', ['foo', 'bar', false, null, 12]],
            ['[\'foo,bar\', \'foo bar\']', ['foo,bar', 'foo bar']],

            // mappings
            ['{ foo: bar, bar: foo, \'false\': false, \'null\': null, integer: 12 }', ['foo' => 'bar', 'bar' => 'foo', 'false' => false, 'null' => null, 'integer' => 12]],
            ['{ foo: bar, bar: \'foo: bar\' }', ['foo' => 'bar', 'bar' => 'foo: bar']],

            // nested sequences and mappings
            ['[foo, [bar, foo]]', ['foo', ['bar', 'foo']]],

            ['[foo, [bar, [foo, [bar, foo]], foo]]', ['foo', ['bar', ['foo', ['bar', 'foo']], 'foo']]],

            ['{ foo: { bar: foo } }', ['foo' => ['bar' => 'foo']]],

            ['[foo, { bar: foo }]', ['foo', ['bar' => 'foo']]],

            ['[foo, { bar: foo, foo: [foo, { bar: foo }] }, [foo, { bar: foo }]]', ['foo', ['bar' => 'foo', 'foo' => ['foo', ['bar' => 'foo']]], ['foo', ['bar' => 'foo']]]],

            ['[foo, \'@foo.baz\', { \'%foo%\': \'foo is %foo%\', bar: \'%foo%\' }, true, \'@service_container\']', ['foo', '@foo.baz', ['%foo%' => 'foo is %foo%', 'bar' => '%foo%'], true, '@service_container']],

            ['{ foo: { bar: { 1: 2, baz: 3 } } }', ['foo' => ['bar' => [1 => 2, 'baz' => 3]]]],
        ];
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
        return [
            'canonical' => ['2001-12-15T02:59:43.1Z', 2001, 12, 15, 2, 59, 43.1, '+0000'],
            'ISO-8601' => ['2001-12-15t21:59:43.10-05:00', 2001, 12, 16, 2, 59, 43.1, '-0500'],
            'spaced' => ['2001-12-15 21:59:43.10 -5', 2001, 12, 16, 2, 59, 43.1, '-0500'],
            'date' => ['2001-12-15', 2001, 12, 15, 0, 0, 0, '+0000'],
        ];
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

        $expectedNested = ['nested' => [$expected]];
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
        $tests = [];

        $dateTime = new \DateTime('2001-12-15 21:59:43', new \DateTimeZone('UTC'));
        $tests['date-time-utc'] = [$dateTime, '2001-12-15T21:59:43+00:00'];

        $dateTime = new \DateTimeImmutable('2001-07-15 21:59:43', new \DateTimeZone('Europe/Berlin'));
        $tests['immutable-date-time-europe-berlin'] = [$dateTime, '2001-07-15T21:59:43+02:00'];

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
        return [
            'enclosed with double quotes' => ['!!binary "SGVsbG8gd29ybGQ="'],
            'enclosed with single quotes' => ["!!binary 'SGVsbG8gd29ybGQ='"],
            'containing spaces' => ['!!binary  "SGVs bG8gd 29ybGQ="'],
        ];
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
        return [
            'length not a multiple of four' => ['!!binary "SGVsbG8d29ybGQ="', '/The normalized base64 encoded data \(data without whitespace characters\) length must be a multiple of four \(\d+ bytes given\)/'],
            'invalid characters' => ['!!binary "SGVsbG8#d29ybGQ="', '/The base64 encoded data \(.*\) contains invalid characters/'],
            'too many equals characters' => ['!!binary "SGVsbG8gd29yb==="', '/The base64 encoded data \(.*\) contains invalid characters/'],
            'misplaced equals character' => ['!!binary "SGVsbG8gd29ybG=Q"', '/The base64 encoded data \(.*\) contains invalid characters/'],
        ];
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

        $yamlString = Inline::dump(['longStringWithQuotes' => $longStringWithQuotes]);
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
        return [
            'null before closing curly brace' => ['{foo:}', ['foo' => null]],
            'null before comma' => ['{foo:, bar: baz}', ['foo' => null, 'bar' => 'baz']],
        ];
    }

    public function testTheEmptyStringIsAValidMappingKey()
    {
        $this->assertSame(['' => 'foo'], Inline::parse('{ "": foo }'));
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
        return [
            'boolean-true' => ['{true: "foo"}', ['true' => 'foo']],
            'boolean-false' => ['{false: "foo"}', ['false' => 'foo']],
            'null' => ['{null: "foo"}', ['null' => 'foo']],
            'float' => ['{0.25: "foo"}', ['0.25' => 'foo']],
        ];
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
