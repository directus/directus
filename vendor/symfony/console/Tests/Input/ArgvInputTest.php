<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Console\Tests\Input;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Input\ArgvInput;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputDefinition;
use Symfony\Component\Console\Input\InputOption;

class ArgvInputTest extends TestCase
{
    public function testConstructor()
    {
        $_SERVER['argv'] = ['cli.php', 'foo'];
        $input = new ArgvInput();
        $r = new \ReflectionObject($input);
        $p = $r->getProperty('tokens');
        $p->setAccessible(true);

        $this->assertEquals(['foo'], $p->getValue($input), '__construct() automatically get its input from the argv server variable');
    }

    public function testParseArguments()
    {
        $input = new ArgvInput(['cli.php', 'foo']);
        $input->bind(new InputDefinition([new InputArgument('name')]));
        $this->assertEquals(['name' => 'foo'], $input->getArguments(), '->parse() parses required arguments');

        $input->bind(new InputDefinition([new InputArgument('name')]));
        $this->assertEquals(['name' => 'foo'], $input->getArguments(), '->parse() is stateless');
    }

    /**
     * @dataProvider provideOptions
     */
    public function testParseOptions($input, $options, $expectedOptions, $message)
    {
        $input = new ArgvInput($input);
        $input->bind(new InputDefinition($options));

        $this->assertSame($expectedOptions, $input->getOptions(), $message);
    }

    public function provideOptions()
    {
        return [
            [
                ['cli.php', '--foo'],
                [new InputOption('foo')],
                ['foo' => true],
                '->parse() parses long options without a value',
            ],
            [
                ['cli.php', '--foo=bar'],
                [new InputOption('foo', 'f', InputOption::VALUE_REQUIRED)],
                ['foo' => 'bar'],
                '->parse() parses long options with a required value (with a = separator)',
            ],
            [
                ['cli.php', '--foo', 'bar'],
                [new InputOption('foo', 'f', InputOption::VALUE_REQUIRED)],
                ['foo' => 'bar'],
                '->parse() parses long options with a required value (with a space separator)',
            ],
            [
                ['cli.php', '--foo='],
                [new InputOption('foo', 'f', InputOption::VALUE_OPTIONAL)],
                ['foo' => ''],
                '->parse() parses long options with optional value which is empty (with a = separator) as empty string',
            ],
            [
                ['cli.php', '--foo=', 'bar'],
                [new InputOption('foo', 'f', InputOption::VALUE_OPTIONAL), new InputArgument('name', InputArgument::REQUIRED)],
                ['foo' => ''],
                '->parse() parses long options with optional value without value specified or an empty string (with a = separator) followed by an argument as empty string',
            ],
            [
                ['cli.php', 'bar', '--foo'],
                [new InputOption('foo', 'f', InputOption::VALUE_OPTIONAL), new InputArgument('name', InputArgument::REQUIRED)],
                ['foo' => null],
                '->parse() parses long options with optional value which is empty (with a = separator) preceded by an argument',
            ],
            [
                ['cli.php', '--foo', '', 'bar'],
                [new InputOption('foo', 'f', InputOption::VALUE_OPTIONAL), new InputArgument('name', InputArgument::REQUIRED)],
                ['foo' => ''],
                '->parse() parses long options with optional value which is empty as empty string even followed by an argument',
            ],
            [
                ['cli.php', '--foo'],
                [new InputOption('foo', 'f', InputOption::VALUE_OPTIONAL)],
                ['foo' => null],
                '->parse() parses long options with optional value specified with no separator and no value as null',
            ],
            [
                ['cli.php', '-f'],
                [new InputOption('foo', 'f')],
                ['foo' => true],
                '->parse() parses short options without a value',
            ],
            [
                ['cli.php', '-fbar'],
                [new InputOption('foo', 'f', InputOption::VALUE_REQUIRED)],
                ['foo' => 'bar'],
                '->parse() parses short options with a required value (with no separator)',
            ],
            [
                ['cli.php', '-f', 'bar'],
                [new InputOption('foo', 'f', InputOption::VALUE_REQUIRED)],
                ['foo' => 'bar'],
                '->parse() parses short options with a required value (with a space separator)',
            ],
            [
                ['cli.php', '-f', ''],
                [new InputOption('foo', 'f', InputOption::VALUE_OPTIONAL)],
                ['foo' => ''],
                '->parse() parses short options with an optional empty value',
            ],
            [
                ['cli.php', '-f', '', 'foo'],
                [new InputArgument('name'), new InputOption('foo', 'f', InputOption::VALUE_OPTIONAL)],
                ['foo' => ''],
                '->parse() parses short options with an optional empty value followed by an argument',
            ],
            [
                ['cli.php', '-f', '', '-b'],
                [new InputOption('foo', 'f', InputOption::VALUE_OPTIONAL), new InputOption('bar', 'b')],
                ['foo' => '', 'bar' => true],
                '->parse() parses short options with an optional empty value followed by an option',
            ],
            [
                ['cli.php', '-f', '-b', 'foo'],
                [new InputArgument('name'), new InputOption('foo', 'f', InputOption::VALUE_OPTIONAL), new InputOption('bar', 'b')],
                ['foo' => null, 'bar' => true],
                '->parse() parses short options with an optional value which is not present',
            ],
            [
                ['cli.php', '-fb'],
                [new InputOption('foo', 'f'), new InputOption('bar', 'b')],
                ['foo' => true, 'bar' => true],
                '->parse() parses short options when they are aggregated as a single one',
            ],
            [
                ['cli.php', '-fb', 'bar'],
                [new InputOption('foo', 'f'), new InputOption('bar', 'b', InputOption::VALUE_REQUIRED)],
                ['foo' => true, 'bar' => 'bar'],
                '->parse() parses short options when they are aggregated as a single one and the last one has a required value',
            ],
            [
                ['cli.php', '-fb', 'bar'],
                [new InputOption('foo', 'f'), new InputOption('bar', 'b', InputOption::VALUE_OPTIONAL)],
                ['foo' => true, 'bar' => 'bar'],
                '->parse() parses short options when they are aggregated as a single one and the last one has an optional value',
            ],
            [
                ['cli.php', '-fbbar'],
                [new InputOption('foo', 'f'), new InputOption('bar', 'b', InputOption::VALUE_OPTIONAL)],
                ['foo' => true, 'bar' => 'bar'],
                '->parse() parses short options when they are aggregated as a single one and the last one has an optional value with no separator',
            ],
            [
                ['cli.php', '-fbbar'],
                [new InputOption('foo', 'f', InputOption::VALUE_OPTIONAL), new InputOption('bar', 'b', InputOption::VALUE_OPTIONAL)],
                ['foo' => 'bbar', 'bar' => null],
                '->parse() parses short options when they are aggregated as a single one and one of them takes a value',
            ],
        ];
    }

    /**
     * @dataProvider provideInvalidInput
     */
    public function testInvalidInput($argv, $definition, $expectedExceptionMessage)
    {
        if (method_exists($this, 'expectException')) {
            $this->expectException('RuntimeException');
            $this->expectExceptionMessage($expectedExceptionMessage);
        } else {
            $this->setExpectedException('RuntimeException', $expectedExceptionMessage);
        }

        $input = new ArgvInput($argv);
        $input->bind($definition);
    }

    public function provideInvalidInput()
    {
        return [
            [
                ['cli.php', '--foo'],
                new InputDefinition([new InputOption('foo', 'f', InputOption::VALUE_REQUIRED)]),
                'The "--foo" option requires a value.',
            ],
            [
                ['cli.php', '-f'],
                new InputDefinition([new InputOption('foo', 'f', InputOption::VALUE_REQUIRED)]),
                'The "--foo" option requires a value.',
            ],
            [
                ['cli.php', '-ffoo'],
                new InputDefinition([new InputOption('foo', 'f', InputOption::VALUE_NONE)]),
                'The "-o" option does not exist.',
            ],
            [
                ['cli.php', '--foo=bar'],
                new InputDefinition([new InputOption('foo', 'f', InputOption::VALUE_NONE)]),
                'The "--foo" option does not accept a value.',
            ],
            [
                ['cli.php', 'foo', 'bar'],
                new InputDefinition(),
                'No arguments expected, got "foo".',
            ],
            [
                ['cli.php', 'foo', 'bar'],
                new InputDefinition([new InputArgument('number')]),
                'Too many arguments, expected arguments "number".',
            ],
            [
                ['cli.php', 'foo', 'bar', 'zzz'],
                new InputDefinition([new InputArgument('number'), new InputArgument('county')]),
                'Too many arguments, expected arguments "number" "county".',
            ],
            [
                ['cli.php', '--foo'],
                new InputDefinition(),
                'The "--foo" option does not exist.',
            ],
            [
                ['cli.php', '-f'],
                new InputDefinition(),
                'The "-f" option does not exist.',
            ],
            [
                ['cli.php', '-1'],
                new InputDefinition([new InputArgument('number')]),
                'The "-1" option does not exist.',
            ],
            [
                ['cli.php', '-fЩ'],
                new InputDefinition([new InputOption('foo', 'f', InputOption::VALUE_NONE)]),
                'The "-Щ" option does not exist.',
            ],
        ];
    }

    public function testParseArrayArgument()
    {
        $input = new ArgvInput(['cli.php', 'foo', 'bar', 'baz', 'bat']);
        $input->bind(new InputDefinition([new InputArgument('name', InputArgument::IS_ARRAY)]));

        $this->assertEquals(['name' => ['foo', 'bar', 'baz', 'bat']], $input->getArguments(), '->parse() parses array arguments');
    }

    public function testParseArrayOption()
    {
        $input = new ArgvInput(['cli.php', '--name=foo', '--name=bar', '--name=baz']);
        $input->bind(new InputDefinition([new InputOption('name', null, InputOption::VALUE_OPTIONAL | InputOption::VALUE_IS_ARRAY)]));

        $this->assertEquals(['name' => ['foo', 'bar', 'baz']], $input->getOptions(), '->parse() parses array options ("--option=value" syntax)');

        $input = new ArgvInput(['cli.php', '--name', 'foo', '--name', 'bar', '--name', 'baz']);
        $input->bind(new InputDefinition([new InputOption('name', null, InputOption::VALUE_OPTIONAL | InputOption::VALUE_IS_ARRAY)]));
        $this->assertEquals(['name' => ['foo', 'bar', 'baz']], $input->getOptions(), '->parse() parses array options ("--option value" syntax)');

        $input = new ArgvInput(['cli.php', '--name=foo', '--name=bar', '--name=']);
        $input->bind(new InputDefinition([new InputOption('name', null, InputOption::VALUE_OPTIONAL | InputOption::VALUE_IS_ARRAY)]));
        $this->assertSame(['name' => ['foo', 'bar', '']], $input->getOptions(), '->parse() parses empty array options as null ("--option=value" syntax)');

        $input = new ArgvInput(['cli.php', '--name', 'foo', '--name', 'bar', '--name', '--anotherOption']);
        $input->bind(new InputDefinition([
            new InputOption('name', null, InputOption::VALUE_OPTIONAL | InputOption::VALUE_IS_ARRAY),
            new InputOption('anotherOption', null, InputOption::VALUE_NONE),
        ]));
        $this->assertSame(['name' => ['foo', 'bar', null], 'anotherOption' => true], $input->getOptions(), '->parse() parses empty array options ("--option value" syntax)');
    }

    public function testParseNegativeNumberAfterDoubleDash()
    {
        $input = new ArgvInput(['cli.php', '--', '-1']);
        $input->bind(new InputDefinition([new InputArgument('number')]));
        $this->assertEquals(['number' => '-1'], $input->getArguments(), '->parse() parses arguments with leading dashes as arguments after having encountered a double-dash sequence');

        $input = new ArgvInput(['cli.php', '-f', 'bar', '--', '-1']);
        $input->bind(new InputDefinition([new InputArgument('number'), new InputOption('foo', 'f', InputOption::VALUE_OPTIONAL)]));
        $this->assertEquals(['foo' => 'bar'], $input->getOptions(), '->parse() parses arguments with leading dashes as options before having encountered a double-dash sequence');
        $this->assertEquals(['number' => '-1'], $input->getArguments(), '->parse() parses arguments with leading dashes as arguments after having encountered a double-dash sequence');
    }

    public function testParseEmptyStringArgument()
    {
        $input = new ArgvInput(['cli.php', '-f', 'bar', '']);
        $input->bind(new InputDefinition([new InputArgument('empty'), new InputOption('foo', 'f', InputOption::VALUE_OPTIONAL)]));

        $this->assertEquals(['empty' => ''], $input->getArguments(), '->parse() parses empty string arguments');
    }

    public function testGetFirstArgument()
    {
        $input = new ArgvInput(['cli.php', '-fbbar']);
        $this->assertNull($input->getFirstArgument(), '->getFirstArgument() returns null when there is no arguments');

        $input = new ArgvInput(['cli.php', '-fbbar', 'foo']);
        $this->assertEquals('foo', $input->getFirstArgument(), '->getFirstArgument() returns the first argument from the raw input');

        $input = new ArgvInput(['cli.php', '--foo', 'fooval', 'bar']);
        $input->bind(new InputDefinition([new InputOption('foo', 'f', InputOption::VALUE_OPTIONAL), new InputArgument('arg')]));
        $this->assertSame('bar', $input->getFirstArgument());

        $input = new ArgvInput(['cli.php', '-bf', 'fooval', 'argval']);
        $input->bind(new InputDefinition([new InputOption('bar', 'b', InputOption::VALUE_NONE), new InputOption('foo', 'f', InputOption::VALUE_OPTIONAL), new InputArgument('arg')]));
        $this->assertSame('argval', $input->getFirstArgument());
    }

    public function testHasParameterOption()
    {
        $input = new ArgvInput(['cli.php', '-f', 'foo']);
        $this->assertTrue($input->hasParameterOption('-f'), '->hasParameterOption() returns true if the given short option is in the raw input');

        $input = new ArgvInput(['cli.php', '-etest']);
        $this->assertTrue($input->hasParameterOption('-e'), '->hasParameterOption() returns true if the given short option is in the raw input');
        $this->assertFalse($input->hasParameterOption('-s'), '->hasParameterOption() returns true if the given short option is in the raw input');

        $input = new ArgvInput(['cli.php', '--foo', 'foo']);
        $this->assertTrue($input->hasParameterOption('--foo'), '->hasParameterOption() returns true if the given short option is in the raw input');

        $input = new ArgvInput(['cli.php', 'foo']);
        $this->assertFalse($input->hasParameterOption('--foo'), '->hasParameterOption() returns false if the given short option is not in the raw input');

        $input = new ArgvInput(['cli.php', '--foo=bar']);
        $this->assertTrue($input->hasParameterOption('--foo'), '->hasParameterOption() returns true if the given option with provided value is in the raw input');
    }

    public function testHasParameterOptionOnlyOptions()
    {
        $input = new ArgvInput(['cli.php', '-f', 'foo']);
        $this->assertTrue($input->hasParameterOption('-f', true), '->hasParameterOption() returns true if the given short option is in the raw input');

        $input = new ArgvInput(['cli.php', '--foo', '--', 'foo']);
        $this->assertTrue($input->hasParameterOption('--foo', true), '->hasParameterOption() returns true if the given long option is in the raw input');

        $input = new ArgvInput(['cli.php', '--foo=bar', 'foo']);
        $this->assertTrue($input->hasParameterOption('--foo', true), '->hasParameterOption() returns true if the given long option with provided value is in the raw input');

        $input = new ArgvInput(['cli.php', '--', '--foo']);
        $this->assertFalse($input->hasParameterOption('--foo', true), '->hasParameterOption() returns false if the given option is in the raw input but after an end of options signal');
    }

    public function testHasParameterOptionEdgeCasesAndLimitations()
    {
        $input = new ArgvInput(['cli.php', '-fh']);
        // hasParameterOption does not know if the previous short option, -f,
        // takes a value or not. If -f takes a value, then -fh does NOT include
        // -h; Otherwise it does. Since we do not know which short options take
        // values, hasParameterOption does not support this use-case.
        $this->assertFalse($input->hasParameterOption('-h'), '->hasParameterOption() returns true if the given short option is in the raw input');
        // hasParameterOption does detect that `-fh` contains `-f`, since
        // `-f` is the first short option in the set.
        $this->assertTrue($input->hasParameterOption('-f'), '->hasParameterOption() returns true if the given short option is in the raw input');
        // The test below happens to pass, although it might make more sense
        // to disallow it, and require the use of
        // $input->hasParameterOption('-f') && $input->hasParameterOption('-h')
        // instead.
        $this->assertTrue($input->hasParameterOption('-fh'), '->hasParameterOption() returns true if the given short option is in the raw input');
        // In theory, if -fh is supported, then -hf should also work.
        // However, this is not supported.
        $this->assertFalse($input->hasParameterOption('-hf'), '->hasParameterOption() returns true if the given short option is in the raw input');

        $input = new ArgvInput(['cli.php', '-f', '-h']);
        // If hasParameterOption('-fh') is supported for 'cli.php -fh', then
        // one might also expect that it should also be supported for
        // 'cli.php -f -h'. However, this is not supported.
        $this->assertFalse($input->hasParameterOption('-fh'), '->hasParameterOption() returns true if the given short option is in the raw input');
    }

    public function testNoWarningOnInvalidParameterOption()
    {
        $input = new ArgvInput(['cli.php', '-edev']);

        $this->assertTrue($input->hasParameterOption(['-e', '']));
        // No warning thrown
        $this->assertFalse($input->hasParameterOption(['-m', '']));

        $this->assertEquals('dev', $input->getParameterOption(['-e', '']));
        // No warning thrown
        $this->assertFalse($input->getParameterOption(['-m', '']));
    }

    public function testToString()
    {
        $input = new ArgvInput(['cli.php', '-f', 'foo']);
        $this->assertEquals('-f foo', (string) $input);

        $input = new ArgvInput(['cli.php', '-f', '--bar=foo', 'a b c d', "A\nB'C"]);
        $this->assertEquals('-f --bar=foo '.escapeshellarg('a b c d').' '.escapeshellarg("A\nB'C"), (string) $input);
    }

    /**
     * @dataProvider provideGetParameterOptionValues
     */
    public function testGetParameterOptionEqualSign($argv, $key, $default, $onlyParams, $expected)
    {
        $input = new ArgvInput($argv);
        $this->assertEquals($expected, $input->getParameterOption($key, $default, $onlyParams), '->getParameterOption() returns the expected value');
    }

    public function provideGetParameterOptionValues()
    {
        return [
            [['app/console', 'foo:bar'], '-e', 'default', false, 'default'],
            [['app/console', 'foo:bar', '-e', 'dev'], '-e', 'default', false, 'dev'],
            [['app/console', 'foo:bar', '--env=dev'], '--env', 'default', false, 'dev'],
            [['app/console', 'foo:bar', '-e', 'dev'], ['-e', '--env'], 'default', false, 'dev'],
            [['app/console', 'foo:bar', '--env=dev'], ['-e', '--env'], 'default', false, 'dev'],
            [['app/console', 'foo:bar', '--env=dev', '--en=1'], ['--en'], 'default', false, '1'],
            [['app/console', 'foo:bar', '--env=dev', '', '--en=1'], ['--en'], 'default', false, '1'],
            [['app/console', 'foo:bar', '--env', 'val'], '--env', 'default', false, 'val'],
            [['app/console', 'foo:bar', '--env', 'val', '--dummy'], '--env', 'default', false, 'val'],
            [['app/console', 'foo:bar', '--', '--env=dev'], '--env', 'default', false, 'dev'],
            [['app/console', 'foo:bar', '--', '--env=dev'], '--env', 'default', true, 'default'],
        ];
    }

    public function testParseSingleDashAsArgument()
    {
        $input = new ArgvInput(['cli.php', '-']);
        $input->bind(new InputDefinition([new InputArgument('file')]));
        $this->assertEquals(['file' => '-'], $input->getArguments(), '->parse() parses single dash as an argument');
    }

    public function testParseOptionWithValueOptionalGivenEmptyAndRequiredArgument()
    {
        $input = new ArgvInput(['cli.php', '--foo=', 'bar']);
        $input->bind(new InputDefinition([new InputOption('foo', 'f', InputOption::VALUE_OPTIONAL), new InputArgument('name', InputArgument::REQUIRED)]));
        $this->assertEquals(['foo' => null], $input->getOptions(), '->parse() parses optional options with empty value as null');
        $this->assertEquals(['name' => 'bar'], $input->getArguments(), '->parse() parses required arguments');

        $input = new ArgvInput(['cli.php', '--foo=0', 'bar']);
        $input->bind(new InputDefinition([new InputOption('foo', 'f', InputOption::VALUE_OPTIONAL), new InputArgument('name', InputArgument::REQUIRED)]));
        $this->assertEquals(['foo' => '0'], $input->getOptions(), '->parse() parses optional options with empty value as null');
        $this->assertEquals(['name' => 'bar'], $input->getArguments(), '->parse() parses required arguments');
    }

    public function testParseOptionWithValueOptionalGivenEmptyAndOptionalArgument()
    {
        $input = new ArgvInput(['cli.php', '--foo=', 'bar']);
        $input->bind(new InputDefinition([new InputOption('foo', 'f', InputOption::VALUE_OPTIONAL), new InputArgument('name', InputArgument::OPTIONAL)]));
        $this->assertEquals(['foo' => null], $input->getOptions(), '->parse() parses optional options with empty value as null');
        $this->assertEquals(['name' => 'bar'], $input->getArguments(), '->parse() parses optional arguments');

        $input = new ArgvInput(['cli.php', '--foo=0', 'bar']);
        $input->bind(new InputDefinition([new InputOption('foo', 'f', InputOption::VALUE_OPTIONAL), new InputArgument('name', InputArgument::OPTIONAL)]));
        $this->assertEquals(['foo' => '0'], $input->getOptions(), '->parse() parses optional options with empty value as null');
        $this->assertEquals(['name' => 'bar'], $input->getArguments(), '->parse() parses optional arguments');
    }
}
