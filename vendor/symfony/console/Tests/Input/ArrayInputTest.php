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
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputDefinition;
use Symfony\Component\Console\Input\InputOption;

class ArrayInputTest extends TestCase
{
    public function testGetFirstArgument()
    {
        $input = new ArrayInput(array());
        $this->assertNull($input->getFirstArgument(), '->getFirstArgument() returns null if no argument were passed');
        $input = new ArrayInput(array('name' => 'Fabien'));
        $this->assertEquals('Fabien', $input->getFirstArgument(), '->getFirstArgument() returns the first passed argument');
        $input = new ArrayInput(array('--foo' => 'bar', 'name' => 'Fabien'));
        $this->assertEquals('Fabien', $input->getFirstArgument(), '->getFirstArgument() returns the first passed argument');
    }

    public function testHasParameterOption()
    {
        $input = new ArrayInput(array('name' => 'Fabien', '--foo' => 'bar'));
        $this->assertTrue($input->hasParameterOption('--foo'), '->hasParameterOption() returns true if an option is present in the passed parameters');
        $this->assertFalse($input->hasParameterOption('--bar'), '->hasParameterOption() returns false if an option is not present in the passed parameters');

        $input = new ArrayInput(array('--foo'));
        $this->assertTrue($input->hasParameterOption('--foo'), '->hasParameterOption() returns true if an option is present in the passed parameters');

        $input = new ArrayInput(array('--foo', '--', '--bar'));
        $this->assertTrue($input->hasParameterOption('--bar'), '->hasParameterOption() returns true if an option is present in the passed parameters');
        $this->assertFalse($input->hasParameterOption('--bar', true), '->hasParameterOption() returns false if an option is present in the passed parameters after an end of options signal');
    }

    public function testGetParameterOption()
    {
        $input = new ArrayInput(array('name' => 'Fabien', '--foo' => 'bar'));
        $this->assertEquals('bar', $input->getParameterOption('--foo'), '->getParameterOption() returns the option of specified name');
        $this->assertEquals('default', $input->getParameterOption('--bar', 'default'), '->getParameterOption() returns the default value if an option is not present in the passed parameters');

        $input = new ArrayInput(array('Fabien', '--foo' => 'bar'));
        $this->assertEquals('bar', $input->getParameterOption('--foo'), '->getParameterOption() returns the option of specified name');

        $input = new ArrayInput(array('--foo', '--', '--bar' => 'woop'));
        $this->assertEquals('woop', $input->getParameterOption('--bar'), '->getParameterOption() returns the correct value if an option is present in the passed parameters');
        $this->assertEquals('default', $input->getParameterOption('--bar', 'default', true), '->getParameterOption() returns the default value if an option is present in the passed parameters after an end of options signal');
    }

    public function testParseArguments()
    {
        $input = new ArrayInput(array('name' => 'foo'), new InputDefinition(array(new InputArgument('name'))));

        $this->assertEquals(array('name' => 'foo'), $input->getArguments(), '->parse() parses required arguments');
    }

    /**
     * @dataProvider provideOptions
     */
    public function testParseOptions($input, $options, $expectedOptions, $message)
    {
        $input = new ArrayInput($input, new InputDefinition($options));

        $this->assertEquals($expectedOptions, $input->getOptions(), $message);
    }

    public function provideOptions()
    {
        return array(
            array(
                array('--foo' => 'bar'),
                array(new InputOption('foo')),
                array('foo' => 'bar'),
                '->parse() parses long options',
            ),
            array(
                array('--foo' => 'bar'),
                array(new InputOption('foo', 'f', InputOption::VALUE_OPTIONAL, '', 'default')),
                array('foo' => 'bar'),
                '->parse() parses long options with a default value',
            ),
            array(
                array(),
                array(new InputOption('foo', 'f', InputOption::VALUE_OPTIONAL, '', 'default')),
                array('foo' => 'default'),
                '->parse() uses the default value for long options with value optional which are not passed',
            ),
            array(
                array('--foo' => null),
                array(new InputOption('foo', 'f', InputOption::VALUE_OPTIONAL, '', 'default')),
                array('foo' => null),
                '->parse() parses long options with a default value',
            ),
            array(
                array('-f' => 'bar'),
                array(new InputOption('foo', 'f')),
                array('foo' => 'bar'),
                '->parse() parses short options',
            ),
            array(
                array('--' => null, '-f' => 'bar'),
                array(new InputOption('foo', 'f', InputOption::VALUE_OPTIONAL, '', 'default')),
                array('foo' => 'default'),
                '->parse() does not parse opts after an end of options signal',
            ),
            array(
                array('--' => null),
                array(),
                array(),
                '->parse() does not choke on end of options signal',
            ),
        );
    }

    /**
     * @dataProvider provideInvalidInput
     */
    public function testParseInvalidInput($parameters, $definition, $expectedExceptionMessage)
    {
        if (method_exists($this, 'expectException')) {
            $this->expectException('InvalidArgumentException');
            $this->expectExceptionMessage($expectedExceptionMessage);
        } else {
            $this->setExpectedException('InvalidArgumentException', $expectedExceptionMessage);
        }

        new ArrayInput($parameters, $definition);
    }

    public function provideInvalidInput()
    {
        return array(
            array(
                array('foo' => 'foo'),
                new InputDefinition(array(new InputArgument('name'))),
                'The "foo" argument does not exist.',
            ),
            array(
                array('--foo' => null),
                new InputDefinition(array(new InputOption('foo', 'f', InputOption::VALUE_REQUIRED))),
                'The "--foo" option requires a value.',
            ),
            array(
                array('--foo' => 'foo'),
                new InputDefinition(),
                'The "--foo" option does not exist.',
            ),
            array(
                array('-o' => 'foo'),
                new InputDefinition(),
                'The "-o" option does not exist.',
            ),
        );
    }

    public function testToString()
    {
        $input = new ArrayInput(array('-f' => null, '-b' => 'bar', '--foo' => 'b a z', '--lala' => null, 'test' => 'Foo', 'test2' => "A\nB'C"));
        $this->assertEquals('-f -b=bar --foo='.escapeshellarg('b a z').' --lala Foo '.escapeshellarg("A\nB'C"), (string) $input);

        $input = new ArrayInput(array('-b' => array('bval_1', 'bval_2'), '--f' => array('fval_1', 'fval_2')));
        $this->assertSame('-b=bval_1 -b=bval_2 --f=fval_1 --f=fval_2', (string) $input);

        $input = new ArrayInput(array('array_arg' => array('val_1', 'val_2')));
        $this->assertSame('val_1 val_2', (string) $input);
    }
}
