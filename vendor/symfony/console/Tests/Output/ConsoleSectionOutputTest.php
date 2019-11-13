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
use Symfony\Component\Console\Formatter\OutputFormatter;
use Symfony\Component\Console\Helper\QuestionHelper;
use Symfony\Component\Console\Input\StreamableInputInterface;
use Symfony\Component\Console\Output\ConsoleSectionOutput;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Output\StreamOutput;
use Symfony\Component\Console\Question\Question;

class ConsoleSectionOutputTest extends TestCase
{
    private $stream;

    protected function setUp(): void
    {
        $this->stream = fopen('php://memory', 'r+b', false);
    }

    protected function tearDown(): void
    {
        $this->stream = null;
    }

    public function testClearAll()
    {
        $sections = [];
        $output = new ConsoleSectionOutput($this->stream, $sections, OutputInterface::VERBOSITY_NORMAL, true, new OutputFormatter());

        $output->writeln('Foo'.PHP_EOL.'Bar');
        $output->clear();

        rewind($output->getStream());
        $this->assertEquals('Foo'.PHP_EOL.'Bar'.PHP_EOL.sprintf("\x1b[%dA", 2)."\x1b[0J", stream_get_contents($output->getStream()));
    }

    public function testClearNumberOfLines()
    {
        $sections = [];
        $output = new ConsoleSectionOutput($this->stream, $sections, OutputInterface::VERBOSITY_NORMAL, true, new OutputFormatter());

        $output->writeln("Foo\nBar\nBaz\nFooBar");
        $output->clear(2);

        rewind($output->getStream());
        $this->assertEquals("Foo\nBar\nBaz\nFooBar".PHP_EOL.sprintf("\x1b[%dA", 2)."\x1b[0J", stream_get_contents($output->getStream()));
    }

    public function testClearNumberOfLinesWithMultipleSections()
    {
        $output = new StreamOutput($this->stream);
        $sections = [];
        $output1 = new ConsoleSectionOutput($output->getStream(), $sections, OutputInterface::VERBOSITY_NORMAL, true, new OutputFormatter());
        $output2 = new ConsoleSectionOutput($output->getStream(), $sections, OutputInterface::VERBOSITY_NORMAL, true, new OutputFormatter());

        $output2->writeln('Foo');
        $output2->writeln('Bar');
        $output2->clear(1);
        $output1->writeln('Baz');

        rewind($output->getStream());

        $this->assertEquals('Foo'.PHP_EOL.'Bar'.PHP_EOL."\x1b[1A\x1b[0J\e[1A\e[0J".'Baz'.PHP_EOL.'Foo'.PHP_EOL, stream_get_contents($output->getStream()));
    }

    public function testClearPreservingEmptyLines()
    {
        $output = new StreamOutput($this->stream);
        $sections = [];
        $output1 = new ConsoleSectionOutput($output->getStream(), $sections, OutputInterface::VERBOSITY_NORMAL, true, new OutputFormatter());
        $output2 = new ConsoleSectionOutput($output->getStream(), $sections, OutputInterface::VERBOSITY_NORMAL, true, new OutputFormatter());

        $output2->writeln(PHP_EOL.'foo');
        $output2->clear(1);
        $output1->writeln('bar');

        rewind($output->getStream());

        $this->assertEquals(PHP_EOL.'foo'.PHP_EOL."\x1b[1A\x1b[0J\x1b[1A\x1b[0J".'bar'.PHP_EOL.PHP_EOL, stream_get_contents($output->getStream()));
    }

    public function testOverwrite()
    {
        $sections = [];
        $output = new ConsoleSectionOutput($this->stream, $sections, OutputInterface::VERBOSITY_NORMAL, true, new OutputFormatter());

        $output->writeln('Foo');
        $output->overwrite('Bar');

        rewind($output->getStream());
        $this->assertEquals('Foo'.PHP_EOL."\x1b[1A\x1b[0JBar".PHP_EOL, stream_get_contents($output->getStream()));
    }

    public function testOverwriteMultipleLines()
    {
        $sections = [];
        $output = new ConsoleSectionOutput($this->stream, $sections, OutputInterface::VERBOSITY_NORMAL, true, new OutputFormatter());

        $output->writeln('Foo'.PHP_EOL.'Bar'.PHP_EOL.'Baz');
        $output->overwrite('Bar');

        rewind($output->getStream());
        $this->assertEquals('Foo'.PHP_EOL.'Bar'.PHP_EOL.'Baz'.PHP_EOL.sprintf("\x1b[%dA", 3)."\x1b[0J".'Bar'.PHP_EOL, stream_get_contents($output->getStream()));
    }

    public function testAddingMultipleSections()
    {
        $sections = [];
        new ConsoleSectionOutput($this->stream, $sections, OutputInterface::VERBOSITY_NORMAL, true, new OutputFormatter());
        new ConsoleSectionOutput($this->stream, $sections, OutputInterface::VERBOSITY_NORMAL, true, new OutputFormatter());

        $this->assertCount(2, $sections);
    }

    public function testMultipleSectionsOutput()
    {
        $output = new StreamOutput($this->stream);
        $sections = [];
        $output1 = new ConsoleSectionOutput($output->getStream(), $sections, OutputInterface::VERBOSITY_NORMAL, true, new OutputFormatter());
        $output2 = new ConsoleSectionOutput($output->getStream(), $sections, OutputInterface::VERBOSITY_NORMAL, true, new OutputFormatter());

        $output1->writeln('Foo');
        $output2->writeln('Bar');

        $output1->overwrite('Baz');
        $output2->overwrite('Foobar');

        rewind($output->getStream());
        $this->assertEquals('Foo'.PHP_EOL.'Bar'.PHP_EOL."\x1b[2A\x1b[0JBar".PHP_EOL."\x1b[1A\x1b[0JBaz".PHP_EOL.'Bar'.PHP_EOL."\x1b[1A\x1b[0JFoobar".PHP_EOL, stream_get_contents($output->getStream()));
    }

    public function testClearSectionContainingQuestion()
    {
        $inputStream = fopen('php://memory', 'r+b', false);
        fwrite($inputStream, "Batman & Robin\n");
        rewind($inputStream);

        $input = $this->getMockBuilder(StreamableInputInterface::class)->getMock();
        $input->expects($this->once())->method('isInteractive')->willReturn(true);
        $input->expects($this->once())->method('getStream')->willReturn($inputStream);

        $sections = [];
        $output = new ConsoleSectionOutput($this->stream, $sections, OutputInterface::VERBOSITY_NORMAL, true, new OutputFormatter());

        (new QuestionHelper())->ask($input, $output, new Question('What\'s your favorite super hero?'));
        $output->clear();

        rewind($output->getStream());
        $this->assertSame('What\'s your favorite super hero?'.PHP_EOL."\x1b[2A\x1b[0J", stream_get_contents($output->getStream()));
    }
}
