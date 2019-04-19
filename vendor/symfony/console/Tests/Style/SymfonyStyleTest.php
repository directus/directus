<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Console\Tests\Style;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Formatter\OutputFormatter;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\ConsoleOutputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Console\Tester\CommandTester;

class SymfonyStyleTest extends TestCase
{
    /** @var Command */
    protected $command;
    /** @var CommandTester */
    protected $tester;
    private $colSize;

    protected function setUp()
    {
        $this->colSize = getenv('COLUMNS');
        putenv('COLUMNS=121');
        $this->command = new Command('sfstyle');
        $this->tester = new CommandTester($this->command);
    }

    protected function tearDown()
    {
        putenv($this->colSize ? 'COLUMNS='.$this->colSize : 'COLUMNS');
        $this->command = null;
        $this->tester = null;
    }

    /**
     * @dataProvider inputCommandToOutputFilesProvider
     */
    public function testOutputs($inputCommandFilepath, $outputFilepath)
    {
        $code = require $inputCommandFilepath;
        $this->command->setCode($code);
        $this->tester->execute([], ['interactive' => false, 'decorated' => false]);
        $this->assertStringEqualsFile($outputFilepath, $this->tester->getDisplay(true));
    }

    /**
     * @dataProvider inputInteractiveCommandToOutputFilesProvider
     */
    public function testInteractiveOutputs($inputCommandFilepath, $outputFilepath)
    {
        $code = require $inputCommandFilepath;
        $this->command->setCode($code);
        $this->tester->execute([], ['interactive' => true, 'decorated' => false]);
        $this->assertStringEqualsFile($outputFilepath, $this->tester->getDisplay(true));
    }

    public function inputInteractiveCommandToOutputFilesProvider()
    {
        $baseDir = __DIR__.'/../Fixtures/Style/SymfonyStyle';

        return array_map(null, glob($baseDir.'/command/interactive_command_*.php'), glob($baseDir.'/output/interactive_output_*.txt'));
    }

    public function inputCommandToOutputFilesProvider()
    {
        $baseDir = __DIR__.'/../Fixtures/Style/SymfonyStyle';

        return array_map(null, glob($baseDir.'/command/command_*.php'), glob($baseDir.'/output/output_*.txt'));
    }

    public function testGetErrorStyle()
    {
        $input = $this->getMockBuilder(InputInterface::class)->getMock();

        $errorOutput = $this->getMockBuilder(OutputInterface::class)->getMock();
        $errorOutput
            ->method('getFormatter')
            ->willReturn(new OutputFormatter());
        $errorOutput
            ->expects($this->once())
            ->method('write');

        $output = $this->getMockBuilder(ConsoleOutputInterface::class)->getMock();
        $output
            ->method('getFormatter')
            ->willReturn(new OutputFormatter());
        $output
            ->expects($this->once())
            ->method('getErrorOutput')
            ->willReturn($errorOutput);

        $io = new SymfonyStyle($input, $output);
        $io->getErrorStyle()->write('');
    }

    public function testGetErrorStyleUsesTheCurrentOutputIfNoErrorOutputIsAvailable()
    {
        $output = $this->getMockBuilder(OutputInterface::class)->getMock();
        $output
            ->method('getFormatter')
            ->willReturn(new OutputFormatter());

        $style = new SymfonyStyle($this->getMockBuilder(InputInterface::class)->getMock(), $output);

        $this->assertInstanceOf(SymfonyStyle::class, $style->getErrorStyle());
    }
}
