<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Console\Tests\Output;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Formatter\OutputFormatterStyle;
use Symfony\Component\Console\Output\Output;

class OutputTest extends TestCase
{
    public function testConstructor()
    {
        $output = new TestOutput(Output::VERBOSITY_QUIET, true);
        $this->assertEquals(Output::VERBOSITY_QUIET, $output->getVerbosity(), '__construct() takes the verbosity as its first argument');
        $this->assertTrue($output->isDecorated(), '__construct() takes the decorated flag as its second argument');
    }

    public function testSetIsDecorated()
    {
        $output = new TestOutput();
        $output->setDecorated(true);
        $this->assertTrue($output->isDecorated(), 'setDecorated() sets the decorated flag');
    }

    public function testSetGetVerbosity()
    {
        $output = new TestOutput();
        $output->setVerbosity(Output::VERBOSITY_QUIET);
        $this->assertEquals(Output::VERBOSITY_QUIET, $output->getVerbosity(), '->setVerbosity() sets the verbosity');

        $this->assertTrue($output->isQuiet());
        $this->assertFalse($output->isVerbose());
        $this->assertFalse($output->isVeryVerbose());
        $this->assertFalse($output->isDebug());

        $output->setVerbosity(Output::VERBOSITY_NORMAL);
        $this->assertFalse($output->isQuiet());
        $this->assertFalse($output->isVerbose());
        $this->assertFalse($output->isVeryVerbose());
        $this->assertFalse($output->isDebug());

        $output->setVerbosity(Output::VERBOSITY_VERBOSE);
        $this->assertFalse($output->isQuiet());
        $this->assertTrue($output->isVerbose());
        $this->assertFalse($output->isVeryVerbose());
        $this->assertFalse($output->isDebug());

        $output->setVerbosity(Output::VERBOSITY_VERY_VERBOSE);
        $this->assertFalse($output->isQuiet());
        $this->assertTrue($output->isVerbose());
        $this->assertTrue($output->isVeryVerbose());
        $this->assertFalse($output->isDebug());

        $output->setVerbosity(Output::VERBOSITY_DEBUG);
        $this->assertFalse($output->isQuiet());
        $this->assertTrue($output->isVerbose());
        $this->assertTrue($output->isVeryVerbose());
        $this->assertTrue($output->isDebug());
    }

    public function testWriteWithVerbosityQuiet()
    {
        $output = new TestOutput(Output::VERBOSITY_QUIET);
        $output->writeln('foo');
        $this->assertEquals('', $output->output, '->writeln() outputs nothing if verbosity is set to VERBOSITY_QUIET');
    }

    public function testWriteAnArrayOfMessages()
    {
        $output = new TestOutput();
        $output->writeln(['foo', 'bar']);
        $this->assertEquals("foo\nbar\n", $output->output, '->writeln() can take an array of messages to output');
    }

    public function testWriteAnIterableOfMessages()
    {
        $output = new TestOutput();
        $output->writeln($this->generateMessages());
        $this->assertEquals("foo\nbar\n", $output->output, '->writeln() can take an iterable of messages to output');
    }

    private function generateMessages(): iterable
    {
        yield 'foo';
        yield 'bar';
    }

    /**
     * @dataProvider provideWriteArguments
     */
    public function testWriteRawMessage($message, $type, $expectedOutput)
    {
        $output = new TestOutput();
        $output->writeln($message, $type);
        $this->assertEquals($expectedOutput, $output->output);
    }

    public function provideWriteArguments()
    {
        return [
            ['<info>foo</info>', Output::OUTPUT_RAW, "<info>foo</info>\n"],
            ['<info>foo</info>', Output::OUTPUT_PLAIN, "foo\n"],
        ];
    }

    public function testWriteWithDecorationTurnedOff()
    {
        $output = new TestOutput();
        $output->setDecorated(false);
        $output->writeln('<info>foo</info>');
        $this->assertEquals("foo\n", $output->output, '->writeln() strips decoration tags if decoration is set to false');
    }

    public function testWriteDecoratedMessage()
    {
        $fooStyle = new OutputFormatterStyle('yellow', 'red', ['blink']);
        $output = new TestOutput();
        $output->getFormatter()->setStyle('FOO', $fooStyle);
        $output->setDecorated(true);
        $output->writeln('<foo>foo</foo>');
        $this->assertEquals("\033[33;41;5mfoo\033[39;49;25m\n", $output->output, '->writeln() decorates the output');
    }

    public function testWriteWithInvalidStyle()
    {
        $output = new TestOutput();

        $output->clear();
        $output->write('<bar>foo</bar>');
        $this->assertEquals('<bar>foo</bar>', $output->output, '->write() do nothing when a style does not exist');

        $output->clear();
        $output->writeln('<bar>foo</bar>');
        $this->assertEquals("<bar>foo</bar>\n", $output->output, '->writeln() do nothing when a style does not exist');
    }

    /**
     * @dataProvider verbosityProvider
     */
    public function testWriteWithVerbosityOption($verbosity, $expected, $msg)
    {
        $output = new TestOutput();

        $output->setVerbosity($verbosity);
        $output->clear();
        $output->write('1', false);
        $output->write('2', false, Output::VERBOSITY_QUIET);
        $output->write('3', false, Output::VERBOSITY_NORMAL);
        $output->write('4', false, Output::VERBOSITY_VERBOSE);
        $output->write('5', false, Output::VERBOSITY_VERY_VERBOSE);
        $output->write('6', false, Output::VERBOSITY_DEBUG);
        $this->assertEquals($expected, $output->output, $msg);
    }

    public function verbosityProvider()
    {
        return [
            [Output::VERBOSITY_QUIET, '2', '->write() in QUIET mode only outputs when an explicit QUIET verbosity is passed'],
            [Output::VERBOSITY_NORMAL, '123', '->write() in NORMAL mode outputs anything below an explicit VERBOSE verbosity'],
            [Output::VERBOSITY_VERBOSE, '1234', '->write() in VERBOSE mode outputs anything below an explicit VERY_VERBOSE verbosity'],
            [Output::VERBOSITY_VERY_VERBOSE, '12345', '->write() in VERY_VERBOSE mode outputs anything below an explicit DEBUG verbosity'],
            [Output::VERBOSITY_DEBUG, '123456', '->write() in DEBUG mode outputs everything'],
        ];
    }
}

class TestOutput extends Output
{
    public $output = '';

    public function clear()
    {
        $this->output = '';
    }

    protected function doWrite($message, $newline)
    {
        $this->output .= $message.($newline ? "\n" : '');
    }
}
